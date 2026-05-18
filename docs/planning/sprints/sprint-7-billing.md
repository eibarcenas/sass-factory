# Sprint 7 — Billing + Plans

## Overview

| Field | Value |
|---|---|
| Branch | `sprint/7-billing` from `develop` |
| Duration | 1 week |
| Agents | `billing-agent` (solo — payment logic requires single ownership) |
| Initiatives | Growth & Monetization (E13, E14) |
| Pre-condition | Sprint 6 merged to `develop` |

## Objective

Implement subscription plans using MercadoPago (Mexico-first, not Stripe), enforce plan limits server-side, build the upgrade flow inside the admin dashboard, implement the viral referral footer, and attribute referred registrations to referrers.

**Why MercadoPago and not Stripe:** The target users are Mexican small and medium businesses (SMBs). MercadoPago has near-universal penetration in Mexico, supports OXXO cash payments, and requires no international credit card. Stripe is not accepted in this codebase — if a Stripe import is found during review, the MR is rejected.

---

## Plans

| Plan | Price | Products | Domain | Footer | Support |
|---|---|---|---|---|---|
| **Free** | $0 | 10 | `catalog.mx/{slug}` | "Hecho con catalog.mx" (required) | Community |
| **Pro** | $199 MXN/mes | 100 | `{slug}.catalog.mx` | Optional (can hide) | Email |
| **Growth** | $499 MXN/mes | Unlimited | Custom domain | None (hidden by default) | Priority |

Plan definitions live as a constant in `packages/core/src/utils/plan-limits.ts` so both the server (limit enforcement) and the client (UI affordances) read from the same source.

```ts
// packages/core/src/utils/plan-limits.ts
export const PLAN_LIMITS = {
  free:   { maxItems: 10,         subdomain: false, customDomain: false, hideFooter: false },
  pro:    { maxItems: 100,        subdomain: true,  customDomain: false, hideFooter: true  },
  growth: { maxItems: Infinity,   subdomain: true,  customDomain: true,  hideFooter: true  },
} as const satisfies Record<string, PlanConfig>

export type PlanId = keyof typeof PLAN_LIMITS
```

---

## MercadoPago Integration

### Library

Use `mercadopago` npm package (official MP SDK). **Never import `stripe` or any Stripe-related package.**

```
packages/core/src/
  (no MP credentials — server only)

apps/admin/
  server/
    utils/
      mercadopago.ts    ← MP client singleton (initialized with secret key from Secret Manager)
```

### Subscription Flow

MercadoPago uses **Preapproval** (subscription) API — not one-time payment links.

Flow:
1. Owner clicks "Suscribirse al Plan Pro" in the admin dashboard.
2. Admin calls `POST /api/billing/subscribe` with `{ plan: 'pro' }`.
3. Server creates an MP Preapproval via `POST https://api.mercadopago.com/preapproval` with:
   - `auto_recurring.frequency = 1`, `auto_recurring.frequency_type = 'months'`
   - `auto_recurring.transaction_amount` = plan price in MXN
   - `back_url` = `https://admin.catalog.mx/owner/billing/status`
   - `reason` = plan display name
4. Server saves `preapprovalId` to `businesses/{id}.billing.preapprovalId` in Firestore.
5. Server returns `{ redirectUrl: mp.init_point }`.
6. Client redirects to `mp.init_point` (MP's hosted checkout).
7. Owner completes payment on MP.
8. MP calls `POST /api/webhooks/mercadopago`.
9. Webhook handler verifies signature → looks up business by `preapprovalId` → updates plan.

### Webhook Handler (`apps/admin/server/api/webhooks/mercadopago.post.ts`)

Security:
1. Verify HMAC-SHA256 signature from header `x-signature` using `MERCADOPAGO_WEBHOOK_SECRET` (from Secret Manager).
2. Compute: `HMAC-SHA256(webhookSecret, rawBody)` — compare with constant-time comparison (`crypto.timingSafeEqual`).
3. If signature mismatch: respond `401`. Log the attempt (without logging the body).

Idempotency:
1. Extract `data.id` (MP payment/subscription ID) from the webhook body.
2. Check Firestore: `billing_events/{mpEventId}` — if exists, respond `200` and exit (already processed).
3. Write `billing_events/{mpEventId} = { processedAt: now, status }` in a Firestore transaction.

Business logic:
- `type = 'subscription_preapproval'` and `status = 'authorized'` → set `business.plan = planId`, `business.billing.status = 'active'`, `business.billing.nextBillingDate`.
- `type = 'subscription_preapproval'` and `status = 'cancelled'` → set `business.billing.status = 'cancelled'`. Plan stays active until `nextBillingDate`.
- `type = 'payment'` and `status = 'rejected'` → increment `business.billing.failedPayments`. MP handles retries automatically. If `failedPayments >= 3` → set `business.status = 'suspended'`, send notification email.

**Never compute financial logic from webhook body values (amounts, etc.).** Always fetch the Preapproval from the MP API using the event ID to get authoritative data.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/billing/subscribe` | owner | Create MP subscription, return redirect URL |
| `GET` | `/api/billing/status` | owner | Current plan + next billing date + status |
| `POST` | `/api/billing/cancel` | owner | Cancel subscription (active until period end) |
| `GET` | `/api/billing/plans` | owner | All plan definitions + user's current plan |
| `POST` | `/api/webhooks/mercadopago` | none (verify by signature) | MP webhook handler |

**POST `/api/billing/subscribe` request:**
```json
{ "plan": "pro" }
```

**POST `/api/billing/subscribe` response:**
```json
{
  "redirectUrl": "https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=...",
  "preapprovalId": "2c938084726fca480172750000000000"
}
```

**GET `/api/billing/status` response:**
```json
{
  "plan": "pro",
  "billingStatus": "active",
  "nextBillingDate": "2026-06-16T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "failedPayments": 0
}
```

**GET `/api/billing/plans` response:**
```json
{
  "currentPlan": "free",
  "plans": [
    {
      "id": "free",
      "name": "Gratis",
      "price": 0,
      "currency": "MXN",
      "maxItems": 10,
      "features": ["10 productos", "catalog.mx/{slug}", "Footer requerido"]
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 199,
      "currency": "MXN",
      "maxItems": 100,
      "features": ["100 productos", "{slug}.catalog.mx", "Footer opcional", "Soporte por email"]
    },
    {
      "id": "growth",
      "name": "Growth",
      "price": 499,
      "currency": "MXN",
      "maxItems": null,
      "features": ["Productos ilimitados", "Dominio propio", "Sin footer", "Soporte prioritario"]
    }
  ]
}
```

---

## Plan Limits Enforcement

Plan limits are enforced in the Nitro route handler (`POST /api/owner/items`), which was scaffolded in Sprint 5. Sprint 7 completes the enforcement:

**File:** `apps/admin/server/api/owner/items.post.ts`

```ts
import { PLAN_LIMITS } from '@sass-factory/core'

// Inside handler:
const business = await getBusinessForOwner(event)
const limit = PLAN_LIMITS[business.plan].maxItems
const currentCount = await getItemCount(business.id) // Firestore count() aggregation

if (currentCount >= limit) {
  throw createError({
    statusCode: 403,
    data: {
      error: 'PLAN_LIMIT_REACHED',
      limit: limit === Infinity ? null : limit,
      current: currentCount,
      upgradeUrl: '/owner/billing/upgrade',
    },
  })
}
```

The `upgradeUrl` opens the billing upgrade page inside the admin dashboard. No redirect — it opens as a modal overlay so the user does not lose their product form.

---

## Upgrade Flow (UI)

**File:** `apps/admin/app/pages/owner/billing/upgrade.vue`

Shown as a full-page route and also as a modal (`UpgradeModal.vue`) when triggered by plan limit errors.

Contents:
- Plan comparison table (Free / Pro / Growth)
- "Suscribirse" button for Pro and Growth
- "Plan actual" badge on current plan
- On click → `POST /api/billing/subscribe` → redirect to MP checkout

**File:** `apps/admin/app/components/UpgradeModal.vue`

- Triggered when any API call returns `403 PLAN_LIMIT_REACHED`
- Shows current plan, limit reached message, plan comparison
- "Ver planes" link → opens `/owner/billing/upgrade`
- "Cerrar" → dismiss modal

---

## Plan Change Logic

| Action | Timing | Implementation |
|---|---|---|
| Upgrade (Free → Pro, Pro → Growth) | Immediate | Webhook updates plan immediately on `authorized` status |
| Downgrade (Growth → Pro, Pro → Free) | End of billing period | Set `cancelAtPeriodEnd = true`. On next billing cycle, MP subscription expires. Webhook sets plan to lower tier. |
| Cancel | End of billing period | `POST /api/billing/cancel` sets `cancelAtPeriodEnd = true`. Does not call MP cancel immediately. |

---

## Viral Footer

### Storefront Footer (`apps/storefront/app/components/StorefrontFooter.vue`)

Logic:
```ts
// Show footer if plan is 'free'
// Hide footer if plan is 'pro' or 'growth' and owner has opted out
const showFooter = business.plan === 'free' || 
  (business.plan !== 'free' && business.showFooter !== false)
```

Footer content (Free plan — cannot be removed):
```html
<footer>
  <a href="https://catalog.mx/registro?ref=tacos-el-gordo">
    Hecho con catalog.mx — Gratis para tu negocio
  </a>
</footer>
```

The footer link uses the business's own slug as the `ref` query parameter.

### Referral Attribution

**File:** `apps/storefront/app/pages/registro.vue` (or handled in `apps/admin` if registration lives there)

On load:
```ts
const route = useRoute()
const ref = route.query.ref as string | undefined
if (ref) {
  // Store in localStorage + cookie (30 day TTL)
  localStorage.setItem('referralSlug', ref)
  useCookie('referralSlug', { maxAge: 60 * 60 * 24 * 30 }).value = ref
}
```

On registration form submit:
- Include `referralSlug` in the registration payload.
- `POST /api/auth/register` saves `referredBy: referralSlug` to the new business document.

**Referral reward trigger (webhook-driven):**

When `business.status` transitions to `active` for the first time (detected in `apps/admin/server/api/webhooks/mercadopago.post.ts` or in a Firestore trigger via Cloud Functions):
1. Read `business.referredBy`.
2. If set, find the referrer business by slug.
3. If referrer is on Free plan: create a Firestore doc `referral_rewards/{referrerBusinessId}_{newBusinessId}` with `{ rewardType: 'pro_1_month', status: 'pending' }`.
4. Scheduled job (Cloud Scheduler, daily) processes pending rewards: applies 1 month Pro to the referrer by extending `billing.nextBillingDate` by 30 days.

---

## File Map

```
apps/admin/
  app/
    pages/
      owner/
        billing/
          index.vue              ← billing status page
          upgrade.vue            ← plan comparison + subscribe CTA
          success.vue            ← post-checkout success (MP redirect back_url)
          cancel.vue             ← user cancelled MP checkout
    components/
      UpgradeModal.vue           ← shown on 403 PLAN_LIMIT_REACHED
      PlanBadge.vue              ← inline badge (Free/Pro/Growth)
      PlanComparisonTable.vue    ← reusable plan table
  server/
    api/
      billing/
        subscribe.post.ts
        status.get.ts
        cancel.post.ts
        plans.get.ts
      webhooks/
        mercadopago.post.ts
    utils/
      mercadopago.ts             ← MP SDK singleton

apps/storefront/
  app/
    components/
      StorefrontFooter.vue       ← viral footer with ref link
    pages/
      registro.vue               ← ref param capture

packages/core/src/
  utils/
    plan-limits.ts               ← PLAN_LIMITS constant (updated with all 3 plans)
  types/
    billing.ts                   ← BillingStatus, PlanId, PlanConfig, ReferralReward
```

---

## Tasks

### Day 1 — Foundation

- [ ] Add `BillingStatus`, `PlanId`, `PlanConfig`, `ReferralReward` types to `packages/core/src/types/billing.ts`
- [ ] Update `PLAN_LIMITS` in `packages/core/src/utils/plan-limits.ts` with all 3 plans
- [ ] Add `mercadopago` npm package to `apps/admin/package.json`
- [ ] Implement `apps/admin/server/utils/mercadopago.ts` (singleton with env var validation)
- [ ] Add `MERCADOPAGO_ACCESS_TOKEN` and `MERCADOPAGO_WEBHOOK_SECRET` to `.env.development` (dev sandbox credentials only)

### Day 1-2 — API Endpoints

- [ ] Write failing test: `POST /api/billing/subscribe` returns `redirectUrl` and saves `preapprovalId` to Firestore
- [ ] Implement `subscribe.post.ts`
- [ ] Write failing test: `GET /api/billing/status` returns current plan from Firestore
- [ ] Implement `status.get.ts`
- [ ] Write failing test: `GET /api/billing/plans` returns all 3 plans with user's current plan marked
- [ ] Implement `plans.get.ts`
- [ ] Write failing test: `POST /api/billing/cancel` sets `cancelAtPeriodEnd = true`
- [ ] Implement `cancel.post.ts`

### Day 2-3 — Webhook Handler

- [ ] Write failing test: webhook with invalid signature returns 401
- [ ] Write failing test: webhook with valid signature but already-processed `mpEventId` returns 200 (idempotent)
- [ ] Write failing test: `authorized` webhook updates `business.plan` and `billing.status`
- [ ] Write failing test: `rejected` payment webhook with `failedPayments >= 3` sets `business.status = 'suspended'`
- [ ] Implement `mercadopago.post.ts` with all guards
- [ ] Write failing test: webhook handler never reads financial amount from body (uses MP API lookup)
- [ ] Implement `fetchPreapprovalFromMercadoPago(preapprovalId)` utility

### Day 3-4 — Plan Limit Enforcement

- [ ] Write failing test: `POST /api/owner/items` with 10 items on Free plan returns 403 with `PLAN_LIMIT_REACHED`
- [ ] Write failing test: `POST /api/owner/items` with 10 items on Pro plan (100 limit) succeeds
- [ ] Update `items.post.ts` to use `PLAN_LIMITS` (complete the stub from Sprint 5)
- [ ] Write failing test: `POST /api/owner/items` with `Infinity` limit (Growth) always succeeds

### Day 4-5 — UI

- [ ] Implement `PlanComparisonTable.vue`
- [ ] Implement `upgrade.vue` (uses `PlanComparisonTable`, calls `POST /api/billing/subscribe`)
- [ ] Implement `billing/index.vue` (shows current plan, next billing date, cancel button)
- [ ] Implement `billing/success.vue` (polled `GET /api/billing/status` until plan updates or timeout 30s)
- [ ] Implement `billing/cancel.vue`
- [ ] Implement `UpgradeModal.vue`
- [ ] Wire `UpgradeModal` into error handling composable so any `403 PLAN_LIMIT_REACHED` opens it
- [ ] Implement `PlanBadge.vue` (shown in header nav)

### Day 5 — Viral Footer + Referrals

- [ ] Write failing test: `StorefrontFooter.vue` shows footer when plan is 'free'
- [ ] Write failing test: `StorefrontFooter.vue` hides footer when plan is 'pro' and `showFooter = false`
- [ ] Implement `StorefrontFooter.vue`
- [ ] Write failing test: `registro.vue` saves `ref` query param to localStorage and cookie
- [ ] Implement referral capture in `registro.vue`
- [ ] Write failing test: `POST /api/auth/register` saves `referredBy` when `referralSlug` is present
- [ ] Implement referral save in register endpoint
- [ ] Implement referral reward logic: `referral_rewards` document creation when business goes active
- [ ] Write a seed script for dev: `infrastructure/scripts/seed-billing-dev.mjs` — creates a test business at each plan level

### Verification

- [ ] Run full E2E: upgrade flow from Free to Pro (MP sandbox)
- [ ] Run E2E: footer appears on Free storefront, footer disappears on Pro storefront
- [ ] Run E2E: referral link from footer populates `ref` param on registration page
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes — zero Stripe imports (run: `grep -r "stripe" apps/ packages/ --include="*.ts"` — must return empty)

---

## Gherkin Scenarios

### Feature: Plan Upgrade

```gherkin
Feature: Plan upgrade
  As a business owner
  I want to upgrade my plan
  So that I can add more products and unlock features

  Background:
    Given I am authenticated as a business owner with role "owner"
    And my business has plan "free"

  Scenario: Owner subscribes to Pro and product limit increases to 100
    When I navigate to "/owner/billing/upgrade"
    And I click "Suscribirse al Plan Pro"
    Then a POST request is sent to "/api/billing/subscribe" with body { "plan": "pro" }
    And the response contains a "redirectUrl" to MercadoPago
    And I am redirected to the MercadoPago checkout URL
    When MercadoPago fires an authorized webhook for the subscription
    Then the webhook handler verifies the HMAC-SHA256 signature
    And the business plan in Firestore is updated to "pro"
    And the billing status is "active"
    And a GET request to "/api/billing/status" returns plan "pro"
    And I can add up to 100 products without a 403 error

  Scenario: Owner tries to add 11th product on Free plan
    Given my business has plan "free"
    And my business has exactly 10 items in Firestore
    When I click "Agregar Producto" and fill in name "Producto 11" and price "50"
    And I click "Guardar"
    Then a POST request is sent to "/api/owner/items"
    And the response status is 403
    And the response body is:
      """
      {
        "error": "PLAN_LIMIT_REACHED",
        "limit": 10,
        "current": 10,
        "upgradeUrl": "/owner/billing/upgrade"
      }
      """
    And the UpgradeModal is shown with plan comparison
    And no new item is created in Firestore

  Scenario: MercadoPago webhook fires for successful payment and plan is updated
    Given a business has preapprovalId "2c938084726fca480172750000000000" in Firestore
    And the MP Preapproval API returns status "authorized" for that ID
    When a POST request is sent to "/api/webhooks/mercadopago" with:
      | type    | subscription_preapproval |
      | data.id | 2c938084726fca480172750000000000 |
    And the x-signature header is a valid HMAC-SHA256 signature
    Then the response status is 200
    And the business plan in Firestore is "pro"
    And a billing_events document is created for idempotency

  Scenario: MercadoPago webhook fires twice for the same payment (idempotency)
    Given a billing_events document already exists for event ID "evt_123"
    When a POST request is sent to "/api/webhooks/mercadopago" with data.id "evt_123"
    And the x-signature header is valid
    Then the response status is 200
    And the business plan is NOT changed again
    And no duplicate Firestore writes occur
```

### Feature: Payment Failure

```gherkin
Feature: Payment failure
  As the platform
  I want to handle failed payments gracefully
  So that businesses are not immediately suspended on the first failure

  Background:
    Given a business "tacos-el-gordo" has plan "pro" and billing status "active"

  Scenario: First payment fails — business stays active (MP retries)
    When MercadoPago fires a "payment" webhook with status "rejected" for "tacos-el-gordo"
    Then the webhook handler increments failedPayments to 1
    And the business status remains "active"
    And the business plan remains "pro"
    And no suspension email is sent

  Scenario: All retries fail — business is suspended and owner receives email notification
    Given the business has failedPayments = 2
    When MercadoPago fires a "payment" webhook with status "rejected" for "tacos-el-gordo"
    Then the webhook handler increments failedPayments to 3
    And the business status in Firestore is set to "suspended"
    And a notification event is queued to send an email to the business owner
    And the email subject contains "Tu plan ha sido suspendido"
    And when a customer visits "catalog.mx/tacos-el-gordo" the HTTP response status is 410
```

### Feature: Viral Loop

```gherkin
Feature: Viral loop
  As the platform
  I want to incentivize owners to share their store
  So that new businesses join through referrals

  Scenario: Customer clicks footer on Free storefront and lands on registration with ref param
    Given a business "tacos-el-gordo" has plan "free"
    And the storefront page "catalog.mx/tacos-el-gordo" is loaded
    Then I see a footer link "Hecho con catalog.mx — Gratis para tu negocio"
    When I click the footer link
    Then I am navigated to "catalog.mx/registro?ref=tacos-el-gordo"
    And the registration page stores "tacos-el-gordo" in localStorage key "referralSlug"
    And the registration page stores "tacos-el-gordo" in a cookie named "referralSlug" with 30 day TTL

  Scenario: Pro plan storefront does not show viral footer when owner opted out
    Given a business "mi-tienda" has plan "pro" and showFooter = false
    When the storefront page "mi-tienda.catalog.mx" is loaded
    Then no footer element with "Hecho con catalog.mx" is visible in the HTML

  Scenario: Referred business goes active and referrer receives 1 month Pro free
    Given business "tacos-el-gordo" (plan: "free") referred business "nueva-tienda"
    And "nueva-tienda" has referredBy = "tacos-el-gordo" in Firestore
    When "nueva-tienda" transitions to status "active" for the first time
    Then a referral_rewards document is created:
      | referrerBusinessId | tacos-el-gordo               |
      | newBusinessId      | nueva-tienda                 |
      | rewardType         | pro_1_month                  |
      | status             | pending                      |
    And the daily scheduled job processes the reward
    And "tacos-el-gordo" billing.nextBillingDate is extended by 30 days
    And a notification is sent to the owner of "tacos-el-gordo" about the free month
```

---

## Security Checklist

- [ ] Webhook signature verified with `crypto.timingSafeEqual` (no string comparison)
- [ ] Webhook body: financial amounts never used — always fetch from MP API
- [ ] Idempotency: `billing_events` checked before any plan mutation
- [ ] `MERCADOPAGO_ACCESS_TOKEN` read from Secret Manager in stg/prod (never plain env var)
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` read from Secret Manager in stg/prod
- [ ] No Stripe imports anywhere in the codebase (`grep -r "stripe"` must return empty)
- [ ] `POST /api/billing/subscribe` requires `role === 'owner'` (not public)
- [ ] `POST /api/webhooks/mercadopago` is public but signature-verified (returns 401 on mismatch)

---

## Definition of Done

- [ ] All Gherkin scenarios pass (Vitest unit + Playwright E2E)
- [ ] `pnpm typecheck` passes across all packages
- [ ] `pnpm lint` passes — zero warnings
- [ ] No Stripe imports: `grep -r "stripe" apps/ packages/ --include="*.ts"` returns empty
- [ ] Webhook signature verification tested with a fabricated signature → must return 401
- [ ] Idempotency tested: same webhook payload sent twice → second call is a no-op
- [ ] Plan limit: unit test verifies 403 at limit for Free (10), Pro (100), and passes for Growth (no limit)
- [ ] Viral footer: Free storefront shows footer; Pro with `showFooter=false` does not
- [ ] Referral: `ref` param stored in localStorage AND cookie (both tested)
- [ ] Referral reward: `referral_rewards` document created when referred business goes active
- [ ] Billing success page polls `GET /api/billing/status` until plan updates (tested with mock that resolves after 2 polls)
- [ ] MR description: screenshot of plan comparison table, screenshot of upgrade modal after hitting limit

---

## MR Template

```markdown
## Sprint 7 — Billing + Plans

### Changes
- [ ] MercadoPago subscription integration
- [ ] Billing API endpoints (subscribe, status, cancel, plans)
- [ ] Webhook handler with signature verification and idempotency
- [ ] Plan limits enforced server-side (items.post.ts)
- [ ] Upgrade flow UI (upgrade.vue + UpgradeModal.vue)
- [ ] Viral footer with referral tracking
- [ ] Referral reward logic

### Screenshots
<!-- Plan comparison table -->
<!-- UpgradeModal triggered by plan limit -->
<!-- Billing status page -->
<!-- Free storefront footer -->

### Security Verification
- [ ] Webhook signature verified (unit test with invalid sig → 401)
- [ ] No financial amounts read from webhook body
- [ ] Idempotency tested (duplicate webhook → no-op)
- [ ] `grep -r "stripe" apps/ packages/ --include="*.ts"` → empty output (paste result)

### Test Coverage
- Unit: `pnpm test --filter admin` (billing routes + webhook)
- E2E: `pnpm test:e2e --grep "Plan upgrade|Payment failure|Viral"`

### Checklist
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] No Stripe imports (grep result attached)
- [ ] Plan limits: Free=10, Pro=100, Growth=unlimited — all tested
- [ ] Viral footer: present on Free, absent on Pro with opt-out
- [ ] Target branch: `develop`
```
