# Sprint 11 — Billing (MercadoPago)

| Field | Value |
|---|---|
| Branch | `sprint/11-billing` from `develop` |
| Status | ⏳ Pending |
| Stack | MercadoPago API, FastAPI, Firestore, React |
| Initiatives | Growth & Monetization (US-028, US-029, US-030) |
| Pre-condition | Sprint 10 merged to `develop` |

---

## Objective

Monetize the platform. Business owners can upgrade from Free to Pro (or Growth), payments are processed via MercadoPago (Mexico-first), and plan limits are enforced server-side. A failed payment triggers a 3-retry cycle before suspending the business.

---

## Plans

| Plan | Price (MXN/mo) | Max Products | Custom Domain | Footer |
|---|---|---|---|---|
| Free | $0 | 10 | ✗ | Visible |
| Pro | $299 | 100 | ✗ | Optional |
| Growth | $599 | Unlimited | ✓ | Hidden |

Plan stored on `Business.plan` in Firestore. Limits enforced in `POST /api/v1/businesses/{id}/items`.

---

## MercadoPago Integration

```
Owner clicks "Upgrade" → POST /api/v1/billing/checkout
                        → MP creates preference
                        → Response: { init_point: "https://mp.com/..." }
                        → Browser redirects to MP checkout
                        → Owner completes payment
                        → MP fires webhook to POST /api/v1/billing/webhook
                        → Validate signature
                        → Update Business.plan in Firestore
                        → Send upgrade email (Firebase Extension or SendGrid)
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/billing/checkout` | OWNER | Create MP checkout preference |
| POST | `/api/v1/billing/webhook` | public (HMAC sig) | Handle MP payment event |
| GET | `/api/v1/billing/status` | OWNER | Current plan + next billing date |

---

## Webhook Security

MercadoPago signs webhook payloads with HMAC-SHA256. Validate before processing:

```python
import hmac, hashlib

def verify_mp_signature(payload: bytes, header_sig: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header_sig)
```

Reject with 400 if signature is invalid — never process unverified payment events.

---

## Failed Payment Handling

| Attempt | Timing | Action |
|---|---|---|
| 1 | Day 0 | Retry automatically |
| 2 | Day 3 | Retry + email warning |
| 3 | Day 7 | Retry + final warning |
| Fail | Day 10 | Set `Business.plan = 'free'`, downgrade limits |

No automatic suspension — downgrade to free, not suspension. Owner keeps access.

---

## Upgrade CTA in Owner Dashboard

- Free tier: banner at top of dashboard: "Upgrade to Pro — unlock 100 products"
- Product limit reached: modal with upgrade button instead of "Add product"
- `GET /api/v1/billing/status` drives the UI — server is source of truth for plan

---

## Key Files

```
apps/catalog-api/app/
├── routers/billing.py             — checkout, webhook, status
└── shared/
    └── billing/
        ├── mercadopago.py         — MP client singleton
        └── plan_limits.py         — plan → max_products map

apps/admin-fe/src/components/owner/
├── BillingBanner.tsx              — upgrade CTA at top of owner dashboard
├── UpgradeModal.tsx               — plan comparison + checkout button
└── PlanBadge.tsx                  — shows current plan next to business name
```

---

## Secrets (Secret Manager)

| Secret Name | Description |
|---|---|
| `mercadopago-access-token` | MP production access token |
| `mercadopago-webhook-secret` | HMAC signing secret for webhooks |

Never in env vars or Dockerfile — always fetched from Secret Manager at startup.

---

## Tests

### Unit (Vitest)
- `BillingBanner` is visible when plan is `free`
- `BillingBanner` is hidden when plan is `pro` or `growth`
- `UpgradeModal` shows correct price for each plan

### Integration (FastAPI)
- `POST /api/v1/billing/checkout` returns `init_point` URL
- `POST /api/v1/billing/webhook` with invalid signature returns 400
- `POST /api/v1/billing/webhook` with valid `payment.approved` upgrades plan in Firestore
- `POST /api/v1/businesses/{id}/items` returns 403 after 10 products on free plan

### E2E (Playwright)
```
billing.spec.ts
  ✓ free plan owner sees upgrade banner
  ✓ adding 11th product on free plan shows upgrade modal
  ✓ upgrade button opens MercadoPago checkout URL
  ✓ pro plan owner can add up to 100 products without prompt
```

---

## Acceptance Criteria

- [ ] MP checkout URL is returned from `/api/v1/billing/checkout`
- [ ] Webhook with valid signature updates `Business.plan` in Firestore
- [ ] Webhook with invalid signature returns 400 (never processed)
- [ ] Free plan is limited to 10 products server-side (returns 403)
- [ ] Upgrade CTA appears in owner dashboard when on free plan
- [ ] Secrets loaded from Secret Manager (not env vars)
- [ ] `pnpm typecheck` passes with zero errors
