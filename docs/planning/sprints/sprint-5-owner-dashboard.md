# Sprint 5 — Owner Dashboard

| Field | Value |
|---|---|
| Branch | `sprint/5-owner-dashboard` from `develop` |
| Status | ✅ Done |
| Stack | React 18, TanStack Query, FastAPI |
| Initiatives | Business Catalog (US-019, US-020, US-021, US-022, US-023) |
| Pre-condition | Sprint 4 merged to `develop` |

---

## Objective

Build the dashboard a business owner uses after their account is activated. Covers product catalog management (add, edit, delete, hide/show) and brand appearance customization (color, logo, tagline). Role-based routing ensures owners cannot access the super admin panel and vice versa.

---

## Role Routing

```
/           → RequireAuth + RequireSuperAdmin → DashboardPage
/owner/*    → RequireAuth + RequireOwner     → OwnerDashboardPage
/redirect   → RoleRedirect (reads claims, sends to correct home)
```

`RequireSuperAdmin` and `RequireOwner` are React components that redirect unauthorized roles — validated from Firebase custom claims stored in Zustand.

---

## Key Files

```
apps/admin-fe/src/
├── pages/owner/
│   └── OwnerDashboardPage.tsx     — owner shell with products + appearance tabs
├── components/owner/
│   ├── ProductList.tsx            — owner's product CRUD
│   ├── AppearancePage.tsx         — color, logo, tagline editor
│   └── CatalogLink.tsx            — shareable storefront link + WhatsApp share
└── App.tsx                        — RequireOwner + RequireSuperAdmin guards
```

---

## Product Management

- Add product: name (required), price (required, 0–999 999 MXN), description (optional), image
- Edit product: same fields + image upload to GCS
- Delete product: confirmation dialog before deleting
- Hide/show: toggle `visible` field — hidden products disappear from storefront
- Price bounds enforced in UI: `Math.min(Math.max(0, val), 999999)`

---

## Appearance Customization

Fields stored on `Business.theme`:
- `primary`: hex color (color picker)
- `logo`: URL (image upload to GCS)
- `tagline`: string, max 120 chars
- `emoji`: single emoji for the avatar fallback

Changes saved via `PATCH /api/v1/businesses/{id}`.

---

## API Endpoints Used

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/businesses/{id}` | Load owner's own business |
| PATCH | `/api/v1/businesses/{id}` | Update theme fields |
| GET | `/api/v1/businesses/{id}/items` | Load products |
| POST | `/api/v1/businesses/{id}/items` | Add product |
| PATCH | `/api/v1/businesses/{id}/items/{item_id}` | Edit product |
| DELETE | `/api/v1/businesses/{id}/items/{item_id}` | Delete product |

---

## Plan Limits (Server-Side)

| Plan | Max Products |
|---|---|
| free | 10 |
| pro | 100 |
| growth | unlimited |

`POST /api/v1/businesses/{id}/items` returns 403 with `{ detail: "plan_limit_reached" }` when the limit is exceeded. UI shows an upgrade prompt.

---

## Tests

### Unit (Vitest)
- `RequireOwner` redirects to `/` when user role is `SUPER_ADMIN`
- `RequireSuperAdmin` redirects to `/owner` when user role is `OWNER`
- Price input clamps to [0, 999999]
- `CatalogLink` builds correct storefront URL from slug

### Integration
- `POST /api/v1/businesses/{id}/items` returns 403 when free plan has 10+ products
- `PATCH /api/v1/businesses/{id}` updates theme fields in Firestore
- Owner cannot access another owner's business (returns 403)

### E2E (Playwright)
```
owner-dashboard.spec.ts
  ✓ owner sees their business products on /owner
  ✓ super admin navigating to /owner is redirected to /
  ✓ owner can add a product and it appears in the list
  ✓ owner can edit a product name and price
  ✓ owner can hide a product (it disappears from storefront)
  ✓ owner can change brand color and tagline
```

---

## Acceptance Criteria

- [ ] Owner cannot access `/` (super admin routes)
- [ ] Super admin cannot access `/owner` (owner routes)
- [ ] Owner can add, edit, delete, and hide products
- [ ] Image upload works and updates product thumbnail immediately
- [ ] Plan limit returns 403 with clear error when exceeded
- [ ] `pnpm typecheck` passes with zero errors
