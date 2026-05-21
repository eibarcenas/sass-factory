# Sprint 9 — Analytics + Super Admin

| Field | Value |
|---|---|
| Branch | `sprint/9-analytics-superadmin` from `develop` |
| Status | 🔄 In Progress |
| Stack | React 18, FastAPI, Firestore |
| Initiatives | Business Intelligence (US-024, US-025, US-026, US-027) |
| Pre-condition | Sprint 8 merged to `develop` |

---

## Objective

Give Erick (super admin) complete visibility into the platform: click tracking from the storefront, per-business analytics in the owner dashboard, a full business pipeline view, and the ability to suspend/reactivate businesses.

---

## Click Tracking

Storefront fires a write to Firestore when a customer clicks the WhatsApp button. **No auth required** — the storefront is public.

```typescript
// apps/storefront — WhatsAppButton.tsx
async function trackClick(businessId: string, itemId: string) {
  await fetch(`${API_URL}/api/v1/analytics/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_id: businessId, item_id: itemId }),
  })
  // fire-and-forget — no await, never blocks the user
}
```

`/api/v1/analytics/click` is in `PUBLIC_PREFIXES`.

---

## Firestore Data Model

```
clicks/{clickId}
  business_id: string
  item_id: string
  timestamp: Timestamp
  source: 'storefront' | 'demo'
```

Aggregated at read time (no background jobs needed at MVP scale).

---

## Analytics API

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/analytics/click` | public | Record click event |
| GET | `/api/v1/analytics/{business_id}` | OWNER or SUPER_ADMIN | Daily clicks + visits last 30 days |
| GET | `/api/v1/analytics/global` | SUPER_ADMIN | MRR, total businesses, new this month, conversion |

---

## Super Admin Panel

A new tab/page in `DashboardPage` visible only to `SUPER_ADMIN`:

| Feature | Description |
|---|---|
| Business pipeline | All businesses with status filters, search by name |
| Global metrics | Total active, MRR (placeholder), new this month, conversion rate |
| Suspend action | Moves `active` → `suspended`; storefront returns 404 |
| Reactivate action | Moves `suspended` → `active` |

---

## Owner Analytics View

In `OwnerDashboardPage`, a new "Analytics" tab shows:
- Daily click count (last 30 days) as a simple bar chart
- Most clicked products (top 5)
- Total visits this month

---

## Key Files

```
apps/api/app/routers/
└── analytics.py              — click endpoint + aggregation queries

apps/admin/src/
├── pages/
│   └── DashboardPage.tsx     — adds SuperAdmin tab
├── components/superadmin/
│   ├── BusinessPipeline.tsx  — filterable business list for SUPER_ADMIN
│   └── GlobalMetrics.tsx     — top-level KPI cards
└── components/owner/
    └── AnalyticsView.tsx     — per-business charts for OWNER
```

---

## Tests

### Unit (Vitest)
- `trackClick` fires and forgets — does not block WhatsApp navigation
- `GlobalMetrics` renders placeholder MRR when no billing data exists
- `BusinessPipeline` filters businesses by status correctly

### Integration (FastAPI)
- `POST /api/v1/analytics/click` without auth returns 200 (public)
- `GET /api/v1/analytics/{business_id}` returns 403 if caller is a different OWNER
- `GET /api/v1/analytics/global` returns 403 for OWNER role
- Suspend action on active business sets status to `suspended` in Firestore

### E2E (Playwright)
```
analytics.spec.ts
  ✓ clicking WhatsApp button records a click event
  ✓ owner sees click count increase after a storefront visit

superadmin.spec.ts
  ✓ super admin sees all businesses in pipeline view
  ✓ super admin can suspend an active business
  ✓ suspended business storefront returns 404
  ✓ super admin can reactivate a suspended business
```

---

## Acceptance Criteria

- [ ] WhatsApp button click is recorded in Firestore (fire-and-forget, no UX impact)
- [ ] Owner analytics page shows daily click data for last 30 days
- [ ] Super admin can see all businesses regardless of status
- [ ] Super admin can suspend and reactivate businesses
- [ ] Suspended business returns 404 on storefront
- [ ] `GET /api/v1/analytics/{id}` returns 403 for wrong owner
- [ ] `pnpm typecheck` passes with zero errors
