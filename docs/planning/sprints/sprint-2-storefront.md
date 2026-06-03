# Sprint 2 — Storefront (Next.js 15)

| Field | Value |
|---|---|
| Branch | `sprint/2-storefront` from `develop` |
| Status | ✅ Done |
| Stack | Next.js 15 App Router, Tailwind CSS, shadcn/ui |
| Initiatives | Business Catalog (US-016, US-017, US-018) |
| Pre-condition | Sprint 1 merged to `develop` |

---

## Objective

Build the public-facing storefront — the page customers visit to browse a business catalog and place WhatsApp orders. Deployed as a standalone Next.js 15 app on Cloud Run. Zero authentication required.

Key requirements:
- **ISR 60s** for active catalog pages — fast and fresh.
- **No cache** (`revalidate: 0`) for demo pages — changes must appear immediately.
- **Demo mode** — same page with a sticky "¿Quieres esto?" banner + prospect capture form.
- **Mobile-first** — primary device is a phone clicking a WhatsApp link.
- **`/health`** route for Cloud Run startup probe.

---

## Key Files

```
apps/storefront-fe/
├── app/
│   ├── [slug]/page.tsx          — active business catalog (ISR 60s)
│   ├── demo/[slug]/page.tsx     — demo view (revalidate: 0)
│   ├── health/route.ts          — Cloud Run probe → { status: 'ok' }
│   └── not-found.tsx
├── components/
│   ├── CatalogView.tsx          — shared between [slug] and demo/[slug]
│   ├── ProductCard.tsx
│   ├── ProductModal.tsx
│   ├── WhatsAppButton.tsx       — builds wa.me URL with pre-filled message
│   ├── DemoBanner.tsx           — sticky top banner (demo only)
│   ├── ProspectModal.tsx        — "Sí, lo quiero" form
│   └── ViralFooter.tsx          — "Hecho con catalog.mx"
├── lib/
│   └── api.ts                   — getCatalog(slug, isDemoMode)
└── types/catalog.ts             — Business, Item (local copy, no @catalog-mx/core dep)
```

---

## getCatalog Caching Strategy

```typescript
// Active pages: ISR 60s
next: { revalidate: 60 }

// Demo pages: no cache (changes must be visible immediately)
next: { revalidate: 0 }
```

`API_URL` is server-side only (no `NEXT_PUBLIC_` prefix) — configurable at runtime in Cloud Run without rebuilding the image.

---

## WhatsApp URL Format

```
https://wa.me/{phone}?text=Hola%2C+me+interesa+{product}+por+${price}
```

Phone is stored on the `Business` record. Message is pre-filled with product name and price.

---

## Tests

### Unit (Vitest)
- `getCatalog` returns `null` on 404 and 410
- `getCatalog` returns `null` on network error
- WhatsApp URL is built correctly for product with price and without price
- Demo page uses `revalidate: 0`; catalog page uses `revalidate: 60`

### Integration
- `GET /api/v1/storefront/{slug}` returns correct Business + Items shape
- `GET /api/v1/storefront/nonexistent` returns 404

### E2E (Playwright)
```
storefront.spec.ts
  ✓ loads active catalog at /{slug}
  ✓ WhatsApp button opens correct wa.me URL
  ✓ unknown slug shows not-found page
  ✓ /demo/{slug} shows DemoBanner
  ✓ prospect form submits and shows confirmation
  ✓ /health returns 200
```

---

## Acceptance Criteria

- [ ] `/{slug}` loads for an active business stored in Firestore
- [ ] `/{slug}` returns 404 for unknown or suspended businesses
- [ ] `/demo/{slug}` shows sticky DemoBanner
- [ ] WhatsApp button URL contains phone and product name
- [ ] Changes to a demo product appear within 1s (no ISR cache)
- [ ] `/health` returns `{ status: 'ok' }` with HTTP 200
- [ ] `pnpm typecheck` passes with zero errors
