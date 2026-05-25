# Sprint 14 — Client Onboarding: Activate, Access, Preview

| Field | Value |
|---|---|
| Branch | `sprint/14-client-onboarding` from `develop` |
| Status | ✅ Merged (#38) |
| Stack | FastAPI, Firestore, React, Next.js 15 |
| Initiatives | Sales Engine (US-038), Business Catalog (US-039), Ops (US-040) |
| Pre-condition | Sprint 13 merged to `develop` |

---

## Objective

A client (business owner) cannot currently access their panel end-to-end.
Three blockers exist:

1. The "Activate owner" button is missing from the DemoCard — `CreateOwnerModal` exists but has no trigger in the UI.
2. The storefront live route (`/{slug}`) returns empty — broken for businesses in any status.
3. There is no way for SUPER_ADMIN to preview what a client sees in their `/owner` panel without logging in as that client.

This sprint ships the complete client onboarding loop: SUPER_ADMIN activates → client signs in → client sees their panel → SUPER_ADMIN can preview it.

---

## Delivery order

```
US-038 ──► US-040

US-038: "Activate owner" button in DemoCard → wires up CreateOwnerModal
   └─► US-040: SUPER_ADMIN preview of owner dashboard (needs activate to test E2E)

US-039: Storefront live route fix (independent — no dependencies)
```

### Stories

| Order | Story | File | Depends on | Effort |
|---|---|---|---|---|
| 1 | US-038 — Activate owner button in DemoCard | [US-038](./US-038-activate-owner-button.md) | — | XS |
| 2 | US-039 — Storefront live route fix | [US-039](./US-039-storefront-live-route.md) | — | S |
| 3 | US-040 — SUPER_ADMIN preview of owner dashboard | [US-040](./US-040-superadmin-owner-preview.md) | US-038 | M |

---

## Key Files

```
apps/admin/src/
├── components/demos/
│   ├── DemoCard.tsx (DemoList.tsx)  — add "Activate owner" button + import CreateOwnerModal
│   └── CreateOwnerModal.tsx         — already built, needs wiring
├── pages/owner/
│   └── OwnerDashboardPage.tsx       — support ?business= query param for SUPER_ADMIN preview
└── App.tsx                          — add /owner/preview/:slug route for SUPER_ADMIN

apps/api/app/routers/
└── businesses.py                    — owner endpoints: allow SUPER_ADMIN with slug override

apps/storefront/app/
└── [slug]/page.tsx                  — debug and fix empty page
```

---

## Tests

### Unit (Vitest)

- `DemoCard`: "Activate owner" button opens modal; modal closed by default
- `OwnerDashboardPage`: renders with `?business=slug` query param when role is SUPER_ADMIN

### Integration (FastAPI)

- `GET /api/v1/owner/business/items` with `SUPER_ADMIN` + `?business=slug` → 200
- `GET /api/v1/owner/business/items` with `SUPER_ADMIN` + no slug → 400
- `GET /api/v1/owner/business/items` with `OWNER` (no slug param) → 200 from JWT claims

### E2E (Playwright)

```
client-onboarding.spec.ts
  ✓ "Activate owner" button visible on every DemoCard
  ✓ Clicking opens modal; entering email + submit calls POST /admin/owners
  ✓ Success state shows the admin URL to send to the client

owner-preview.spec.ts
  ✓ SUPER_ADMIN visits /owner/preview/heladeria-el-pinguino → sees owner dashboard
  ✓ OWNER visits /owner/preview/:slug → redirected to /owner (no slug override)
  ✓ Unauthenticated → redirected to /login

storefront-live.spec.ts
  ✓ /{slug} returns 200 for a business in DEMO status
  ✓ /{slug} returns 200 for a business in ACTIVE status
  ✓ /{slug} returns 404 for unknown slug
```

---

## Acceptance Criteria

- [ ] Every DemoCard has an "Activate owner" button that opens `CreateOwnerModal`
- [ ] After activation the modal shows the admin URL to send to the client
- [ ] Client signs in with Google → lands on `/owner` with their business data
- [ ] `/{slug}` storefront route returns the catalog for any non-suspended business
- [ ] SUPER_ADMIN can visit `/owner/preview/:slug` and see the owner dashboard for any business
- [ ] OWNER visiting `/owner/preview/:slug` is redirected to `/owner` (no bypass)
- [ ] `pnpm typecheck` passes with zero errors
