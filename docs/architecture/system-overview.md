# System Overview

## GCP Architecture Diagram

```
                              INTERNET
                                 │
                    ┌────────────┴──────────────┐
                    │                           │
         Firebase App Hosting          Firebase App Hosting
           apps/storefront               apps/dashboard
          (Next.js SSR/ISR)             (Next.js SSR)
          slug-based routing            admin + owner panel
                    │                           │
                    └───────────┬───────────────┘
                                │  calls FastAPI
                                ▼
                        Cloud Run (apps/api)
                        FastAPI — Python 3.13
                        Hexagonal architecture
                                │
          ┌─────────────────────┼──────────────────────┐
          │                     │                      │
     Firestore            Cloud Storage          Firebase Auth
     (database)           (item images)          (JWT — Custom Claims)
          │
     ┌────┴────┐
     │         │
  GA4 SDK   Eventarc
  (traffic)    │
          ┌────┴────────────────┐
          │                     │
    Cloud Run (workers)   Cloud Scheduler
    image_processor       clicks_cleanup
    cascade_delete        (cron 3am MX)
```

## Firebase App Hosting

Firebase App Hosting (2024) is managed Cloud Run + Firebase integration with native Next.js SSR support.

```
Advantages:
  ├── Next.js SSR out of the box (no Dockerfile for frontends)
  ├── Built-in CDN + global edge caching
  ├── Preview channels per git branch (free staging envs)
  ├── Git-based deploy (push to main → auto deploy)
  ├── Environment variable management via apphosting.yaml
  ├── Automatic scaling (0 → N instances, managed)
  └── GA4 integration at zero extra cost
```

## Services Breakdown

| Service | Purpose | Notes |
|---------|---------|-------|
| Firebase App Hosting | Runs both Next.js apps (SSR) | Managed Cloud Run + CDN |
| Cloud Run (apps/api) | FastAPI business logic | Python 3.13, hexagonal arch |
| Cloud Run (apps/workers) | Async event handlers | Eventarc triggers, CloudEvents |
| Firestore | Primary database | Native mode, multi-region nam5 |
| Cloud Storage | Item images | Bucket: `{project}-business-assets` |
| Firebase Auth | Authentication | Custom Claims for RBAC |
| Google Analytics 4 | Traffic + behavior metrics | Free, dual-write with Firestore |
| Secret Manager | API keys, credentials | Referenced by apphosting.yaml |
| Eventarc | Event routing | Storage + Firestore triggers → workers |
| Cloud Scheduler | Cron jobs | clicks-cleanup at 3am MX |

## CI/CD Pipeline

```
Push to feature/* branch:
  └── Firebase App Hosting → preview channel URL (free staging)
      e.g. storefront--feat-catalog-abc123.web.app

Push to develop:
  └── GitHub Actions:
      ├── pnpm typecheck
      ├── pytest unit
      ├── pnpm test:rules
      └── deploy to staging

Push to main:
  └── GitHub Actions:
      ├── all tests pass
      ├── Terraform plan → apply (infra changes)
      └── Firebase App Hosting (auto-deploy from main)
```

CI uses Workload Identity Federation — no service account keys in GitHub secrets.

## Environments

```
dev   → Firebase project: [name]-dev
        └── Emulator Suite: Firestore, Auth, Storage (localhost)
            FIRESTORE_EMULATOR_HOST=localhost:8080

staging → Firebase project: [name]-staging
          └── Firebase App Hosting preview channels
              Cloud Run (staging revision)

prod  → Firebase project: [name]-prod
        └── Firebase App Hosting (auto-deploy from main branch)
            Cloud Run (tagged releases)
```

---

## Request Flows

### Storefront — visitor loads landing page

```
Browser → GET /gorras-bebe-kids
               │
               ▼
        Next.js [slug]/page.tsx  (Server Component)
               │
               ├── fetch(`${API_URL}/v1/businesses/gorras-bebe-kids`, { next: { revalidate: 300 }})
               │   → FastAPI Cloud Run → Firestore
               │
               ▼
        BusinessLandingPage (FSD pages layer)
               │
        ┌──────┼──────────────────────────────────────┐
        │      │      │        │         │             │
     Hero  Catalog  HowToBuy Trust  Testimonials  StickyWA
        │      │
        │   ProductCard × N
        │      │
        │   [WhatsApp CTA button]
        │      │
        ▼      ▼
     track-whatsapp-click feature
     → POST /api/clicks → FastAPI → Firestore clicks/{id}
```

### Dashboard — admin creates a business

```
ACTOR           DASHBOARD UI              FASTAPI              FIRESTORE
───────────────────────────────────────────────────────────────────────

Admin opens
/businesses/new
                │
                ▼
        ┌───────────────┐
        │  Form Step 1  │   name, business type,
        │  (base data)  │   WhatsApp number, plan
        └──────┬────────┘
               │ submit
               ▼
        Client-side validation:
        • name required (3-80 chars)
        • WhatsApp E.164 format (+521XXXXXXXXXX)
        • type selected
               │ valid
               ▼
        POST /v1/businesses
        Bearer {firebase_jwt}
               │────────────────────────────►│
               │                             │ verifyIdToken()
               │                             │ require(P.businesses.create)
               │                             │
               │                             │ sanitizeText(name)
               │                             │ generateSlug(name)
               │                             │ "Gorras Bebe & Kids"
               │                             │   → "gorras-bebe-kids"
               │                             │
               │                             │ Firestore transaction:
               │                             │ ┌──────────────────────────┐
               │                             │ │ GET slugs/"gorras-bebe-  │
               │                             │ │      kids"               │
               │                             │ │   exists? → 409          │
               │                             │ │   empty?  → reserve slug │
               │                             │ │                          │
               │                             │ │ SET slugs/{slug}         │
               │                             │ │   { businessId }         │
               │                             │ │                          │
               │                             │ │ SET businesses/{id}      │
               │                             │ │   { name, slug, plan,    │
               │                             │ │     whatsappNumber,      │
               │                             │ │     status: 'draft',     │
               │                             │ │     ownerId: null }      │
               │                             │ └──────────────────────────┘
               │◄────────────────────────────│
               │  201 { businessId, slug }   │
               │
               ▼
        Redirect →
        /businesses/{id}/edit
```

### Admin publishes a business

```
Admin clicks [Publish]
               │
               ▼
        PATCH /v1/businesses/{id}/publish
        Bearer {firebase_jwt}
               │────────────────────────────►│
               │                             │ require(P.businesses.publish)
               │                             │
               │                             │ UPDATE businesses/{id}
               │                             │   { status: 'active',
               │                             │     updatedAt: now }
               │                             │
               │                             │ revalidatePath('/{slug}')
               │                             │ → ISR cache invalidated
               │◄────────────────────────────│
               │  200 { slug, publicUrl }    │
               │
               ▼
        ┌─────────────────────────────────┐
        │  ✅ Business published          │
        │                                 │
        │  Your landing is live at:       │
        │  platform.com/gorras-bebe-kids  │
        │  [Copy link] [Share] [View →]   │
        └─────────────────────────────────┘
```

---

## Business Status States

```
                Admin creates        Owner edits         Admin publishes
                    │                   │                    │
                    ▼                   ▼                    ▼
  ┌──────────┐  ┌──────────┐    ┌──────────┐         ┌──────────┐
  │  (none)  │─►│  draft   │───►│  draft   │────────►│  active  │
  └──────────┘  └──────────┘    └──────────┘         └──────────┘
                                                           │
                                        Admin suspends     │
                                             │             ▼
                                             │       ┌──────────┐
                                             └──────►│suspended │
                                                     └──────────┘
                                                           │
                                        Admin reactivates  │
                                             └──────────►  ▼
                                                       ┌──────────┐
                                                       │  active  │
                                                       └──────────┘

Storefront behavior:
  draft      → visible only with ?preview=true (admin only)
  active     → public, ISR cached (revalidate: 300)
  suspended  → 404, ISR invalidated immediately via revalidatePath
```

## Dual Write — GA4 + Firestore

```typescript
// features/track-whatsapp-click/model.ts
// fires on WhatsApp CTA click

// 1. GA4 — platform-wide traffic insights
gtag('event', 'whatsapp_click', {
  business_id:   businessId,
  business_slug: slug,
  item_id:       itemId ?? null,
  item_name:     itemName ?? null,
})

// 2. Firestore — per-business billing data
await addDoc(collection(db, 'clicks'), {
  businessId, itemId, type: 'whatsapp', createdAt: serverTimestamp()
})
```

| System | Owner | Purpose |
|--------|-------|---------|
| GA4 | Platform operator | Traffic analytics, funnels, geography — all businesses |
| Firestore clicks | Per-business | Click count for billing proof + dashboard charts |
