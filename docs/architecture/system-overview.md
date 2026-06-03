# System Overview — catalog.mx

> Last updated: 2026-05-27
> Stack: React (admin) · Next.js 15 (storefront) · FastAPI (API) · Firebase Auth · Firestore · GCP Cloud Run

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser / Client                           │
├───────────────────┬─────────────────────┬───────────────────────────┤
│   Admin Panel     │     Storefront       │       Mobile WhatsApp     │
│  (React + Vite)   │  (Next.js 15 / RSC)  │     wa.me deep links      │
│  Cloud Run :8080  │   Cloud Run :8080    │                           │
└────────┬──────────┴──────────┬───────────┴───────────────────────────┘
         │                     │
         │  REST + Bearer JWT  │  REST (public)
         ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FastAPI — Cloud Run :8080                       │
│  AuthMiddleware (factory_auth)  →  CORS  →  slowapi rate limiter    │
│                                                                     │
│  /api/v1/admin/*      SUPER_ADMIN only                              │
│  /api/v1/owner/*      OWNER + SUPER_ADMIN                           │
│  /api/v1/storefront/* public                                        │
│  /api/v1/demos/*/accept  public                                     │
│  /api/v1/prospects    public                                        │
│  /api/v1/images/upload  auth required                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
          ┌──────────────┼───────────────┐
          ▼              ▼               ▼
    Firestore      Firebase Auth    GCS Bucket
  (ei-catalog-*)  (catalog-mx-*)  (ei-catalog-images-*)
```

---

## 2. Monorepo Structure

```
sass-factory/
├── packages/
│   ├── core/       @eguru/core      — shared TypeScript types + enums
│   ├── ui/         @eguru/ui        — shadcn/ui Radix components
│   ├── auth/       @eguru/auth      — Zustand store + Firebase restore hook
│   └── client/     @eguru/client    — generic typed HTTP client factory
├── apps/
│   ├── admin/      React + Vite     — SUPER_ADMIN + OWNER dashboard
│   ├── storefront/ Next.js 15       — public customer catalog pages
│   └── backend/
│       └── services/
│           └── catalog-api/ FastAPI — catalog REST API + RBAC + Firestore
└── .github/workflows/
    ├── ci.yml           — typecheck + test on every PR
    ├── deploy-dev.yml   — auto-deploy on push to develop
    ├── deploy-stg.yml   — auto-deploy on push to release/**
    └── deploy-prod.yml  — manual approval, canary deploy to production
```

### Package dependency graph

```
apps/admin-fe      → @eguru/core, @eguru/ui, @eguru/auth, @eguru/client
apps/storefront-fe → @eguru/core, @eguru/ui
apps/catalog-api → factory_auth (Python, private git repo)
```

---

## 3. Apps

### Admin Panel (`apps/admin-fe`)

React + Vite SPA served by Nginx on Cloud Run. Two roles share the same container:

```
/login              → LoginPage (Google Sign-In)
/redirect           → RoleRedirect (routes by role after auth)
/*                  → DashboardPage        (SUPER_ADMIN only)
/owner/preview/:slug → OwnerDashboardPage  (SUPER_ADMIN read-only preview)
/owner/*            → OwnerDashboardPage   (OWNER only)
```

**Role guards:**
- `RequireAuth` — user must be logged in (or mockMode)
- `RequireSuperAdmin` — `user.role === 'SUPER_ADMIN'`
- `RequireOwner` — `user.role === 'OWNER'`

**Mock mode:** when `VITE_FIREBASE_API_KEY` is absent, the store injects a mock SUPER_ADMIN user — no Firebase credentials needed for local dev.

### Storefront (`apps/storefront-fe`)

Next.js 15 App Router with ISR. Two routes:

| Route | Cache | Logic |
|---|---|---|
| `/[slug]` | `revalidate: 60s` | Live catalog — any non-suspended status |
| `/demo/[slug]` | `revalidate: 0` | Demo — if status is `accepted` or `active`, redirects to `/[slug]` |

Calls `GET /api/v1/storefront/{slug}` (server-side, `API_URL` env var, never exposed to browser).

**Next.js API proxy routes** (browser → Next.js → FastAPI, avoids CORS):
- `POST /api/prospects` → `/api/v1/prospects`
- `POST /api/demo-accept` → `/api/v1/demos/{slug}/accept`
- `POST /api/wa-click` → `/api/v1/storefront/{slug}/whatsapp-click`

### API (`apps/catalog-api`)

FastAPI on Python 3.13. Single Cloud Run service.

**Middleware stack (innermost → outermost):**
1. `AuthMiddleware` (`factory_auth`) — validates Firebase JWT, injects `request.state.user`
2. `CORSMiddleware` — all origins, explicit method list
3. `slowapi` — rate limiter keyed by `x-forwarded-for` IP

---

## 4. API Routes

### Public (no auth required)

```
GET  /health
GET  /api/v1/storefront/{slug}              — business + visible items
POST /api/v1/storefront/{slug}/whatsapp-click — increment click counter
POST /api/v1/prospects                       — customer lead capture
POST /api/v1/demos/{slug}/accept            — owner self-acceptance from demo page
```

### Authenticated

```
POST /api/v1/auth/resolve-claims            — set custom claims after Google sign-in (any role)
POST /api/v1/images/upload                  — upload to GCS (any role)
```

### OWNER + SUPER_ADMIN

```
PATCH  /api/v1/owner/business                      — update tagline, name, whatsapp, theme
GET    /api/v1/owner/business/items                — list items
POST   /api/v1/owner/business/items                — add item
PATCH  /api/v1/owner/business/items/{item_id}     — update item (name, price, description, image, visible, order)
DELETE /api/v1/owner/business/items/{item_id}     — delete item
```

### SUPER_ADMIN only

```
GET  /api/v1/admin/businesses                      — list all businesses
POST /api/v1/admin/businesses/{id}/{action}        — status transition
GET  /api/v1/admin/businesses/{id}/items           — list items (any business)
POST /api/v1/admin/businesses/{id}/items           — add item
PATCH /api/v1/admin/businesses/{id}/items/{id}    — update item
DELETE /api/v1/admin/businesses/{id}/items/{id}   — delete item
POST /api/v1/admin/demos                           — create demo from template
POST /api/v1/admin/owners                          — activate owner (sets Firebase claims)
GET  /api/v1/admin/prospects                       — list prospects (?businessId filter)
```

---

## 5. Authentication & Authorization

### Firebase Auth + Custom Claims

All identity lives in Firebase Auth. Authorization state is encoded as JWT custom claims:

```json
{
  "role": "SUPER_ADMIN" | "OWNER",
  "business_id": "<business-slug>",
  "modules": ["CATALOG", "APPEARANCE"]
}
```

### Owner onboarding flow (two paths)

**Path A — Admin activates owner** (`POST /admin/owners`):
```
Admin enters owner email → API creates pending_owners/{email}
                         → sets Firebase custom claims immediately
                         → business.status → ACTIVE
Owner signs in with Google → claims already set → /owner dashboard
```

**Path B — Owner self-accepts from demo** (`POST /demos/{slug}/accept`):
```
Owner visits /demo/{slug} → clicks "Activate" → enters Google email
                          → API creates pending_owners/{email}
                          → business.status → ACCEPTED
Owner signs in with Google → no claims yet → frontend detects missing business_id
                           → calls POST /auth/resolve-claims
                           → API reads pending_owners, sets custom claims
                           → frontend force-refreshes token
                           → buildUser extracts role + business_id → /owner dashboard
```

### Client-side claim detection (`packages/auth/src/firebase.ts`)

```typescript
// Trigger: no business_id in claims after sign-in
if (!tokenResult.claims.business_id && resolveClaimsUrl) {
  const res = await fetch(resolveClaimsUrl, { method: 'POST',
    headers: { Authorization: `Bearer ${tokenResult.token}` } })
  if ((await res.json()).resolved) {
    tokenResult = await fbUser.getIdTokenResult(true) // force refresh
  }
}
```

### API middleware (`factory_auth.AuthMiddleware`)

Per-request logic (reads env vars at request time, not init time):

```
OPTIONS → pass through (CORS preflight)
path in public_prefixes → pass through
DEV_USER_EMAIL + ENVIRONMENT=local → inject mock SUPER_ADMIN (local dev bypass)
INTERNAL_SERVICE_SECRET header match → inject internal service user
Authorization: Bearer <token> → verify Firebase JWT → inject UserContext
else → 401
```

### RBAC enforcement

`_resolve_owner_slug()` in `businesses.py` enforces tenant isolation:
- **OWNER:** always uses `user.business_id` from claims — cannot query other businesses
- **SUPER_ADMIN:** must pass `?business=<slug>` — can query any business

---

## 6. Firestore Schema

### `businesses/{slug}`

```
slug            string      document ID, URL-safe
name            string
type            string      heladeria|barberia|estetica|restaurante|panaderia|gym|mecanico|otro
whatsapp        string      phone number
city            string
tagline         string?
theme           map         { primary, secondary, accent, background, font, emoji, gradient }
status          string      see state machine below
plan            string      free|pro|growth
ownerId         string?     Firebase UID (set after activation)
ownerEmail      string?
createdAt       timestamp
updatedAt       timestamp
acceptedAt      timestamp?
whatsappClicks  integer     click counter (incremented by storefront)
lastWhatsappClickAt  timestamp?
prospectCount   integer     denormalized count
lastProspectAt  timestamp?
```

#### Subcollection: `businesses/{slug}/items`

```
businessId      string
name            string
price           float
currency        string      always "MXN"
description     string?
image           string?     GCS public URL
visible         boolean
order           integer     1-indexed
createdAt       timestamp
updatedAt       timestamp
```

### `pending_owners/{email}`

Pre-registration record. Consumed by `resolve-claims`, never deleted automatically.

```
email           string      document ID
businessId      string
role            string      always "OWNER"
modules         string[]    ["CATALOG", "APPEARANCE"]
ownerName       string?
createdAt       timestamp
resolvedAt      timestamp?  set when claims are assigned
resolvedUid     string?     Firebase UID of resolved user
```

### `prospects/{auto-id}`

Customer leads from storefront "Yes, I want it" form.

```
businessId      string
contactName     string?
phone           string?
email           string?
status          string      new (only current value; CRM transitions planned in Sprint 19)
createdAt       timestamp
```

---

## 7. Business Status State Machine

```
                  ┌───────┐
                  │ draft │
                  └───┬───┘
                      │ admin creates demo
                  ┌───▼───┐
                  │ demo  │◄─────────── /admin/demos (POST)
                  └───┬───┘
          ┌───────────┤
          │ sent      │ owner accepts
          │           │ (self-service)
     ┌────▼────┐  ┌───▼────────┐
     │  sent   │  │  accepted  │◄── /demos/{slug}/accept (POST)
     └────┬────┘  └─────┬──────┘
          │ accepted     │ admin activates
          │              │
          └──────┬───────┘
             ┌───▼───┐
             │ active│◄──────────── /admin/owners (POST) or /admin/businesses/{id}/activate
             └───┬───┘
                 │
            ┌────▼─────┐    ┌──────────┐
            │suspended │◄──►│  active  │
            └────┬─────┘    └──────────┘
                 │
            ┌────▼────────────────────────┐
            │ expired | rejected | archived│  terminal
            └─────────────────────────────┘
```

---

## 8. SDK Packages

### `factory_auth` (Python — private)

**Source:** `github.com/eibarcenas/factory-sdk` subdirectory `python/`
**Installed via:** BuildKit secret mount in Dockerfile — PAT never stored in image layer

```python
from factory_auth import AuthMiddleware, get_current_user, UserContext, Role, require_role
```

- `AuthMiddleware` — Starlette middleware, configurable `public_prefixes`
- `get_current_user` — FastAPI dependency, returns `UserContext`
- `UserContext` — `{ firebase_uid, email, role, business_id, modules, is_owner }`
- `require_role(*roles)` — FastAPI dependency factory for RBAC guards

### `@eguru/auth` (TypeScript)

```typescript
import { createAuthStore, useFirebaseAuthRestore } from '@eguru/auth'
```

- `createAuthStore(config)` — Zustand store with mock mode support
- `useFirebaseAuthRestore(opts)` — React hook: subscribes to Firebase auth state, calls resolve-claims if needed, returns `{ checking: boolean }`

### `@eguru/client` (TypeScript)

```typescript
import { createApiClient } from '@eguru/client'
const api = createApiClient({ baseUrl, getToken })
// api.get<T>(), api.post<T>(), api.patch<T>(), api.del()
```

---

## 9. CI/CD Pipeline

```
git push develop    → deploy-dev.yml  → ei-catalog-dev  (auto, ~5 min)
git push release/*  → deploy-stg.yml  → ei-catalog-stg  (auto, ~5 min)
git push production → deploy-prod.yml → ei-catalog-prod (manual approval + canary)
```

### Build matrix per service

| Service | Base image | Key build step |
|---|---|---|
| API | `python:3.13-slim` | `uv pip install` + BuildKit secret for `factory_auth` |
| Storefront | `node:20-alpine` multi-stage | `pnpm build` with monorepo root context |
| Admin | `node:20-alpine` → `nginx:alpine` | `pnpm build` with monorepo root context |

**Why monorepo root context:** Dockerfiles use `COPY packages/core/ ./packages/core/` etc. to include workspace packages before installing deps. Building from `apps/*/` alone would miss them.

**Why BuildKit secrets:** The `GH_PAT` token for the private `factory-sdk` repo is mounted at build time via `--mount=type=secret` and never written to any image layer.

### Authentication to GCP

Workload Identity Federation — no service account key files in GitHub. Three secrets per environment: `WIF_PROVIDER_{ENV}`, `DEPLOYER_SA_{ENV}`, `RUNTIME_SA_{ENV}`.

---

## 10. Local Development

```bash
# API (port 8000)
cd apps/catalog-api && .venv/bin/uvicorn main:app --reload
# .env provides: DEV_USER_EMAIL, ENVIRONMENT=local, FIRESTORE_PROJECT_ID, GCS_DEV_FALLBACK=true

# Admin (port 5173, mock mode — no Firebase needed)
pnpm -F admin-fe dev

# Storefront (port 3000)
pnpm -F storefront-fe dev

# Tests
cd apps/catalog-api && .venv/bin/pytest -q
pnpm -F admin-fe test
pnpm -F @eguru/core test

# Typecheck all
pnpm -F @eguru/core typecheck
pnpm -F admin-fe typecheck
pnpm -F storefront-fe typecheck
```

**Mock mode:** admin works without Firebase keys — Zustand injects a mock `SUPER_ADMIN` user. Set `VITE_MOCK_ROLE` and `VITE_MOCK_BUSINESS_ID` for owner mock.

---

## 11. Environment URLs

| Environment | Admin | Storefront | API |
|---|---|---|---|
| **dev** | [catalog-mx-admin-dev-q3peeste7q-uc.a.run.app](https://catalog-mx-admin-dev-q3peeste7q-uc.a.run.app) | [catalog-mx-storefront-dev-q3peeste7q-uc.a.run.app](https://catalog-mx-storefront-dev-q3peeste7q-uc.a.run.app) | [catalog-mx-api-dev-q3peeste7q-uc.a.run.app](https://catalog-mx-api-dev-q3peeste7q-uc.a.run.app) |
| **stg** | pending | pending | pending |
| **prod** | pending | pending | pending |
