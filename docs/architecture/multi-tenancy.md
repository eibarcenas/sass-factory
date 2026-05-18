# Multi-Tenant Routing Strategy

## One App, Not One Deployment Per Client

Deploying one Next.js instance per business is an anti-pattern at scale:

```
❌ ONE DEPLOYMENT PER CLIENT
   100 clients = 100 Firebase App Hosting backends
                 100 CI/CD pipelines
                 100 configs to update on every release
                 100 cold-start surfaces
   → Operational nightmare. Not how Shopify, Squarespace, or Linktree work.
```

The correct pattern is **one shared app that reads the domain/slug to determine which
business to render**. Firebase Hosting maps custom domains to the same backend.

## Routing Tiers (by plan)

```
STARTER  →  platform.com/gorras-bebe-kids      (slug-based, shared path)
PRO      →  gorras.platform.com                (subdomain, same app)
GROWTH   →  gorrasbebes.com                    (custom domain, same app)
```

All three resolve to the same Next.js `[slug]/page.tsx` server component.

## How It Works

```
                    gorrasbebes.com
                          │
               Firebase Hosting custom domain
                          │
                          ▼
              Firebase App Hosting (storefront)
                          │
              Next.js middleware.ts
                          │
              reads Host header: "gorrasbebes.com"
                          │
                          ▼
              FastAPI: GET /v1/businesses?customDomain=gorrasbebes.com
                          │
                          ▼
              renders business landing (same code as /gorras-bebe-kids)
```

## Firestore Domain Fields

```
businesses/{businessId}
├── slug:          "gorras-bebe-kids"
├── subdomain:     "gorras"             ← Pro tier: gorras.platform.com
└── customDomain:  "gorrasbebes.com"   ← Growth tier: user-owned domain
```

Lookup priority on request:
```
1. Check path slug    → /gorras-bebe-kids
2. Check subdomain    → gorras.platform.com → query subdomain field
3. Check customDomain → gorrasbebes.com     → query customDomain field
```

## Storefront Middleware

```typescript
// apps/storefront/src/middleware.ts
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isPlatformDomain = host.includes('platform.com')

  if (isPlatformDomain) {
    // Normal slug routing: platform.com/[slug] → handled by app router
    return NextResponse.next()
  }

  // Custom domain or subdomain → rewrite to internal handler
  // Internal handler resolves domain → slug via FastAPI
  const url = request.nextUrl.clone()
  url.pathname = `/__domain${url.pathname}`
  return NextResponse.rewrite(url)
}
```

## Custom Domain Setup (Growth tier)

```
Firebase Console → Hosting → Add custom domain
  gorrasbebes.com → points to storefront backend

Client DNS:
  CNAME gorrasbebes.com → storefront--prod-abc.web.app

SSL:
  Firebase provisions certificate automatically (Let's Encrypt)
```

Admin dashboard action:
```
Feature: connect-custom-domain
  Input:  business ID + domain string
  Action: 1. Update business.customDomain in Firestore
             2. Instruct client to set CNAME in their DNS
             3. Admin verifies via Firebase Console
  Status: pending_verification | active | failed
```

## Plan Summary

```
┌─────────────┬──────────────────────────────┬────────────────────────┐
│ Plan        │ URL                          │ Infrastructure         │
├─────────────┼──────────────────────────────┼────────────────────────┤
│ Starter     │ platform.com/gorras-bebe-kids│ shared path, 1 backend │
│ Pro         │ gorras.platform.com          │ subdomain, 1 backend   │
│ Growth      │ gorrasbebes.com              │ custom domain, 1 backend│
└─────────────┴──────────────────────────────┴────────────────────────┘

All tiers: same Next.js build, same Firebase App Hosting instance,
           same Firestore, same codebase. Zero per-client deployments.
```
