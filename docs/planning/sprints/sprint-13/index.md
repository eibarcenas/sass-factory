# Sprint 13 — Prospect CRM + Storefront UX

| Field | Value |
|---|---|
| Branch | `sprint/13-prospect-crm-storefront-ux` from `develop` |
| Status | ⏳ Pending |
| Stack | FastAPI, Firestore, React, Next.js 15 |
| Initiatives | Sales Engine (US-032–035), Business Catalog (US-036–037) |
| Pre-condition | Sprint 12 merged to `develop` |

---

## Objective

Close the gap between the Prospects page and the Demos pipeline. Prospects are currently read-only — there is no way to contact, accept, or reject a lead from the admin. Demo cards don't show prospect signals. Active businesses (clients) are mixed into the same pipeline as cold leads.

Also ships two storefront UX features: client-side product search and a wishlist/cart that builds a WhatsApp bulk-order message.

---

## Delivery order

Two independent tracks. Stories within each track must ship in order.

### Track A — Admin CRM

```
US-032 ──► US-033 ──► US-034
                        US-035 (independent polish, ships anytime)

US-032: Prospect state machine + Contact/Accept/Reject endpoints
   └─► US-033: Demo badge + "View demo →" link + ?businessId= filter
          └─► US-034: Sidebar PIPELINE/CLIENTS split + /admin/clients page
US-035: Dashboard button + pipeline label rename (no dependency)
```

### Track B — Storefront UX

```
US-036 ──► US-037

US-036: SearchBar + useProductSearch (ProductCard untouched)
   └─► US-037: Save toggle on ProductCard + useWishlist + WishlistPanel + WhatsApp message + ProspectForm pre-fill
```

### Stories

| Order | Story | File | Depends on | Effort |
|---|---|---|---|---|
| 1 | US-032 — Prospect contact/accept/reject | [US-032](./US-032-prospect-contact-actions.md) | — | M |
| 2 | US-033 — Demo-prospect bidirectional link | [US-033](./US-033-demo-prospect-link.md) | US-032 | S |
| 3 | US-034 — Prospect vs. client labeling | [US-034](./US-034-prospect-vs-client.md) | US-033 | S |
| 4 | US-035 — Dashboard UX + action labels | [US-035](./US-035-dashboard-ux.md) | none | XS |
| 5 | US-036 — Storefront search bar | [US-036](./US-036-storefront-search.md) | — | S |
| 6 | US-037 — Storefront wishlist/cart | [US-037](./US-037-storefront-wishlist.md) | US-036 | M |

---

## Key Files

```
apps/catalog-api/app/routers/
└── prospects.py            — PATCH /{id}/contact, /accept, /reject

packages/core/src/types/
└── prospect.ts             — ProspectStatus enum + valid transitions

apps/admin-fe/src/
├── components/prospects/
│   └── ProspectRow.tsx     — Contact/Accept/Reject buttons
├── components/demos/
│   └── DemoCard.tsx        — prospect badge + bidirectional link
├── pages/
│   ├── ProspectsPage.tsx   — ?businessId= filter + breadcrumb
│   └── ClientsPage.tsx     — new: active businesses + accepted prospects
└── layouts/
    └── AdminSidebar.tsx    — PIPELINE / CLIENTS split

apps/storefront-fe/
├── components/
│   ├── SearchBar.tsx       — new
│   ├── WishlistPanel.tsx   — new
│   ├── CartBadge.tsx       — new (fixed position)
│   └── ProductCard.tsx     — add save/unsave toggle
└── composables/
    ├── useProductSearch.ts — new
    └── useWishlist.ts      — new, localStorage keyed by slug
```

---

## Tests

### Unit (Vitest)

- Prospect state machine: all valid and invalid transitions
- `useProductSearch`: empty query, case-insensitive match, AND composition with category
- `useWishlist`: save, increment, decrement-to-remove, buildWhatsAppMessage, localStorage restore

### Integration (FastAPI)

- `PATCH /api/v1/admin/prospects/{id}/contact` without auth → 401
- `PATCH /api/v1/admin/prospects/{id}/contact` with `status=new` → 200
- `PATCH /api/v1/admin/prospects/{id}/accept` with `status=contacted` → 200, business advanced
- `PATCH /api/v1/admin/prospects/{id}/accept` with `status=new` → 422
- `PATCH /api/v1/admin/prospects/{id}/reject` with `status=contacted` → 200, business unchanged
- `GET /api/v1/admin/prospects?businessId={id}` → returns only matching prospects

### E2E (Playwright)

```
prospect-crm.spec.ts
  ✓ Contact button changes badge from New to Contacted
  ✓ Accept button advances business pipeline to Accepted
  ✓ Reject button marks prospect rejected, pipeline unchanged
  ✓ Demo card shows prospect count badge
  ✓ Clicking badge navigates to filtered Prospects page

storefront-search.spec.ts
  ✓ Typing "cro" shows only Croissant
  ✓ Clearing search restores full grid
  ✓ Zero results shows empty state

storefront-wishlist.spec.ts
  ✓ Save button fills heart and increments badge
  ✓ Saved items persist after page reload
  ✓ Order via WhatsApp opens wa.me link with correct message
  ✓ ProspectForm notes pre-filled from wishlist items
```

---

## Acceptance Criteria

- [ ] Prospect row shows Contact / Accept / Reject buttons with correct disabled states
- [ ] Accepting a prospect auto-advances business from `sent` → `accepted`
- [ ] Demo card shows `prospectCount` badge; clicking navigates to filtered prospects
- [ ] Active businesses appear under CLIENTS sidebar section, not PIPELINE
- [ ] `+ New demo` button is in the page header (not buried at the bottom)
- [ ] "Mark as sent" renamed to "Sent to prospect" with tooltip on all pipeline cards
- [ ] Storefront search filters products in real time with no API call
- [ ] Search composes with category filter (AND logic)
- [ ] Wishlist persists across page reloads via localStorage
- [ ] WhatsApp message lists all wishlist items with quantities and total
- [ ] ProspectForm notes pre-filled from wishlist when "Yes, I want it" is clicked
- [ ] `pnpm typecheck` passes with zero errors
