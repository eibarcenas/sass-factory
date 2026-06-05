# Canonical Routing Map

Status: implemented canonical contract
Scope: landing, admin, seller, platform, public store, authentication, and APIs.

## Core Rules

1. Every route segment is English.
2. Localized applications always include `/es` or `/en`.
3. `store` is the only product term. Do not use `demo`, `preview`, `catalog`, or `storefront`.
4. `seller` is the only member-role term. Do not use `owner`.
5. `platform` is the internal operator workspace.
6. Seller account and store information live together under `seller/profile`.
7. Authentication begins on the localized landing page.
8. The admin application does not expose login or registration pages.
9. Old routes are removed, not preserved as aliases.
10. Unsupported routes return `404`.
11. Every redirect and navigation target must be canonical.
12. No redirect may target or pass through a removed route.

Firebase claim values remain `OWNER` and `SUPER_ADMIN` as private authentication
constants. They must not appear in routes, product terminology, or UI labels.

## Route Language

The locale changes translated content, not route segments:

```text
/es/seller/products
/en/seller/products
```

Canonical route vocabulary:

```text
auth
business
businesses
callback
cookies
dashboard
health
impersonate
legal
new
onboarding
platform
privacy
products
profile
requests
seller
store
stores
terms
```

## Application Boundaries

| Application | Responsibility |
|---|---|
| Landing | Marketing, locale selection, Google authentication, legal content |
| Admin | Authentication callback, onboarding, seller workspace, platform workspace |
| Store | Public stores and customer request links |
| Identity API | Authentication exchange, claims, and registration |
| Stores API | Stores, products, seller profile, and customer requests |
| Prospects API | Sales prospects |
| Notifications | Internal event consumers and notifications |

## Landing

Canonical routes:

| Route | Purpose |
|---|---|
| `/{locale}` | Marketing, sign in, and account creation entry |
| `/{locale}/legal/privacy` | Privacy notice |
| `/{locale}/legal/terms` | Terms of service |
| `/{locale}/legal/cookies` | Cookie policy |

The landing root resolves the browser locale before rendering:

```text
/ -> /es
/ -> /en
```

The application must use an always-prefixed locale strategy. There are no
landing `/login` or `/register` routes.

## Authentication

Authentication starts from `/{locale}` on the landing.

Flow:

1. User selects Google authentication on the landing.
2. Landing authenticates with Firebase.
3. Identity API verifies the Firebase token.
4. Identity API creates a short-lived, one-time exchange code.
5. Landing opens the admin callback route.
6. Admin exchanges the code for its own authenticated session.
7. Admin sends the user to the route determined by role and onboarding state.

Admin callback:

```text
/{locale}/auth/callback
```

Firebase ID tokens must never be placed in query strings.

Anonymous requests to private admin routes perform a full navigation to:

```text
LANDING_URL/{locale}?returnTo=<encoded-admin-path>
```

## Onboarding

Canonical route:

```text
/{locale}/onboarding/business
```

This page creates the seller's business and store after authentication.

Completion destinations:

| State | Destination |
|---|---|
| Seller ready | `/{locale}/seller/products` |
| Platform operator | `/{locale}/platform/dashboard` |
| Missing business data | `/{locale}/onboarding/business` |

## Seller Workspace

Canonical routes:

| Route | Purpose |
|---|---|
| `/{locale}/seller/products` | Manage store products and public store link |
| `/{locale}/seller/requests` | Manage customer requests |
| `/{locale}/seller/profile` | Seller account, store information, locale, sign out, deletion |

`/{locale}/seller/profile` contains:

- Google account name, email, and photo.
- Store name, logo, type, tagline, WhatsApp, city, and state.
- Locale preference.
- Sign out.
- Account deletion.

Seller navigation is route-based. Product, request, and profile views must not
be tabs controlled only by component state.

## Platform Workspace

Canonical routes:

| Route | Purpose |
|---|---|
| `/{locale}/platform/dashboard` | Platform metrics and recent activity |
| `/{locale}/platform/businesses` | Business lifecycle board |
| `/{locale}/platform/businesses/new` | Create a business and store |
| `/{locale}/platform/businesses/:businessId` | Manage one business |
| `/{locale}/platform/businesses/:businessId/store` | Review the business store |
| `/{locale}/platform/businesses/:businessId/impersonate` | Start seller impersonation |
| `/{locale}/platform/profile` | Platform account, locale, and sign out |

Successful impersonation opens:

```text
/{locale}/seller/products
```

The impersonation state determines which business is being managed. The seller
routes do not change.

## Admin Root Resolution

The localized admin root resolves directly by user state:

| User state | Destination |
|---|---|
| Seller | `/{locale}/seller/products` |
| Platform operator | `/{locale}/platform/dashboard` |
| Authenticated without business | `/{locale}/onboarding/business` |
| Anonymous | Landing `/{locale}` |

No admin `/login`, `/register`, `/redirect`, `/owner`, `/dashboard`,
`/clientes`, or `/ajustes` route exists.

## Navigation Policy

All navigation mechanisms must target canonical routes directly:

```text
Navigate
navigate()
redirect()
router.push()
router.replace()
window.location.assign()
window.location.replace()
href
```

Valid cross-application destinations:

```text
landing -> /{locale}
landing -> ADMIN_URL/{locale}/auth/callback
admin   -> LANDING_URL/{locale}
store   -> LANDING_URL/{locale}
```

Valid internal admin destinations:

```text
/{locale}/onboarding/business
/{locale}/seller/products
/{locale}/seller/requests
/{locale}/seller/profile
/{locale}/platform/dashboard
/{locale}/platform/businesses
/{locale}/platform/businesses/new
/{locale}/platform/businesses/:businessId
/{locale}/platform/businesses/:businessId/store
/{locale}/platform/businesses/:businessId/impersonate
/{locale}/platform/profile
```

Removed routes are never redirect targets. Requests for them terminate with
`404` and do not perform another navigation.

## Sign Out

Sign out clears the admin Firebase session and local application state, then
performs a full navigation:

```text
window.location.replace(`${LANDING_URL}/${locale}`)
```

## Public Store

Canonical routes:

| Route | Purpose |
|---|---|
| `/:slug` | Active public store |
| `/store/:slug` | Non-public store opened by an authorized review link |
| `/requests/:token` | Customer request receipt or status |
| `/health` | Infrastructure health check |

The store application root does not render marketing content:

```text
/ -> LANDING_URL/{locale}
```

There are no `/demo/:slug` or `/preview/:slug` routes.

Reserved store slugs:

```text
api
auth
en
es
health
legal
platform
requests
seller
store
```

## Store BFF

Canonical routes:

```text
POST /api/stores/:slug/requests
POST /api/stores/:slug/whatsapp-clicks
POST /api/stores/:slug/acceptance
POST /api/prospects
GET  /health
```

No BFF route contains `demo`, `preview`, `catalog`, or `storefront`.

## Identity API

Canonical routes:

```text
GET  /health
POST /api/v1/auth/exchanges
POST /api/v1/auth/exchanges/:code/consume
POST /api/v1/auth/claims/resolve
GET  /api/v1/business-slugs/:slug/availability
POST /api/v1/business-registrations
```

## Stores API

Canonical public routes:

```text
GET  /health
GET  /api/v1/stores/:slug
POST /api/v1/stores/:slug/requests
POST /api/v1/stores/:slug/whatsapp-clicks
GET  /api/v1/requests/:token
```

Canonical seller routes:

```text
GET    /api/v1/seller/profile
PATCH  /api/v1/seller/profile
DELETE /api/v1/seller/profile
GET    /api/v1/seller/products
POST   /api/v1/seller/products
PATCH  /api/v1/seller/products/:productId
DELETE /api/v1/seller/products/:productId
GET    /api/v1/seller/requests
PATCH  /api/v1/seller/requests/:requestId/status
```

Canonical platform routes:

```text
GET    /api/v1/platform/businesses
POST   /api/v1/platform/businesses
GET    /api/v1/platform/businesses/:businessId
PATCH  /api/v1/platform/businesses/:businessId
POST   /api/v1/platform/businesses/:businessId/actions/:action
GET    /api/v1/platform/businesses/:businessId/products
POST   /api/v1/platform/businesses/:businessId/products
PATCH  /api/v1/platform/businesses/:businessId/products/:productId
DELETE /api/v1/platform/businesses/:businessId/products/:productId
POST   /api/v1/platform/businesses/:businessId/seller
POST   /api/v1/platform/stores/:storeId/acceptance
```

Image upload belongs to the store resource:

```text
POST /api/v1/stores/:storeId/images
```

## Prospects API

Canonical routes:

```text
GET  /health
POST /api/v1/prospects
GET  /api/v1/platform/prospects
```

## Notifications

Canonical routes:

```text
GET  /health
POST /internal/events/:eventName
```

## Final Route Tree

```text
landing
├── /es
├── /en
├── /:locale/legal/privacy
├── /:locale/legal/terms
└── /:locale/legal/cookies

admin
├── /:locale/auth/callback
├── /:locale/onboarding/business
├── /:locale/seller/products
├── /:locale/seller/requests
├── /:locale/seller/profile
├── /:locale/platform/dashboard
├── /:locale/platform/businesses
├── /:locale/platform/businesses/new
├── /:locale/platform/businesses/:businessId
├── /:locale/platform/businesses/:businessId/store
├── /:locale/platform/businesses/:businessId/impersonate
└── /:locale/platform/profile

store
├── /
├── /:slug
├── /store/:slug
├── /requests/:token
└── /health
```

## Root-Cause Migration

This migration is a breaking replacement, not an alias-based transition.

1. Add centralized route builders and locale parsing.
2. Replace admin component-state tabs with nested routes.
3. Rename seller, store, and platform components and modules.
4. Replace all frontend links with canonical routes.
5. Remove every redirect or navigation whose destination is not canonical.
6. Replace all backend routers with canonical endpoints.
7. Rename the demos service and store-related code to stores.
8. Remove duplicate marketing components from the store application.
9. Implement the landing-to-admin authentication exchange.
10. Remove obsolete pages, handlers, tests, environment references, and docs.
11. Deploy all affected services together.
12. Verify unsupported old routes return `404`.

## Validation

The migration is complete only when:

- No source file defines or generates a route containing forbidden terms.
- No application contains login or registration pages outside the landing.
- Every localized route has identical English segments under `/es` and `/en`.
- Seller navigation updates the browser URL.
- Sign out returns to the localized landing.
- Public stores use `/:slug` or `/store/:slug`.
- API OpenAPI documents expose only canonical endpoints.
- Every redirect and navigation target belongs to the canonical route map.
- No redirect target contains a removed route segment.
- Removed routes return `404`.
