# Sprint 6 — Analytics + Super Admin

## Overview

| Field | Value |
|---|---|
| Branch | `sprint/6-analytics-superadmin` from `develop` |
| Duration | 1 week |
| Agents | `analytics-mf-agent` + `superadmin-agent` (parallel) |
| Initiatives | Business Intelligence (E11, E12) |
| Pre-condition | Sprint 5 merged to `develop` |

## Objective

Implement anonymous click tracking from the storefront, an analytics dashboard for business owners, and a super admin panel (`apps/ops`) for platform management and moderation. The two agents work in parallel: `analytics-mf-agent` owns the Analytics MFE and tracking endpoints; `superadmin-agent` owns the `apps/ops` Nuxt app and all `/api/superadmin/*` endpoints.

---

## Architecture Decisions

- Click tracking is fire-and-forget from the storefront: the storefront calls `POST /api/clicks` and does not await or retry.
- No BigQuery in MVP: all analytics queries run against Firestore. Aggregation is done server-side in Nitro.
- Rate limiting for clicks uses a Firestore transaction on a counter document (`/businesses/{id}/click_rate/{itemId_hour}`) — no Redis required.
- The super admin app (`apps/ops`) is a separate Nuxt 4 app on a separate Cloud Run service (`ops.catalog.mx`). It shares `packages/core` types but has its own Firebase Auth check (role = `superadmin`).
- `superadmin` role is assigned by setting `customClaims.role = 'superadmin'` via Firebase Admin SDK (never from the client).

---

## New Packages / Apps

| App/Package | Path | Port (dev) | Notes |
|---|---|---|---|
| Analytics MFE | `apps/mfe/analytics` | 3022 | Module Federation remote, exposed as `analytics` |
| Ops (Super Admin) | `apps/ops` | 3030 | Standalone Nuxt app, not a remote |

Both added to `pnpm-workspace.yaml`.

---

## Click Tracking

### Storefront Integration

**File:** `apps/storefront/app/composables/useClickTracker.ts`

```ts
// Fire-and-forget — never block the UI
export function trackClick(payload: ClickPayload) {
  fetch('/api/clicks', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {/* silently ignore network errors */})
}
```

Called from `apps/storefront/app/components/ItemCard.vue` on the "Pedir" button click.

`ClickPayload` type (defined in `packages/core/src/types/analytics.ts`):
```ts
export interface ClickPayload {
  businessId: string
  itemId: string
  source: 'storefront' | 'shared_link' | 'demo'
  referrer: string          // document.referrer, max 200 chars, truncated
  userAgentHash: string     // SHA-256 of userAgent, first 16 chars — no PII
  createdAt: string         // ISO 8601
}
```

### API Endpoint

**File:** `apps/admin/server/api/clicks.post.ts`

- No authentication required (public endpoint).
- Input validated with `zod` schema (same fields as `ClickPayload`).
- Rate limit check: read `click_rate/{businessId}_{itemId}_{hour}` from Firestore. If count >= 10, respond `204` (silently drop — do not inform the client whether the click was recorded).
- If within rate limit: write to `businesses/{businessId}/clicks/{clickId}` and increment counter in a Firestore transaction.

**Firestore document schema (`businesses/{id}/clicks/{clickId}`):**
```
{
  businessId: string
  itemId: string
  source: 'storefront' | 'shared_link' | 'demo'
  referrer: string
  userAgentHash: string
  createdAt: Timestamp
  ttl: Timestamp  // createdAt + 90 days (for Firestore TTL policy)
}
```

### Rate Limit Counter Document

Path: `click_rate/{businessId}_{itemId}_{YYYY-MM-DD_HH}`

```
{
  count: number
  windowStart: Timestamp
}
```

Counter is incremented inside a Firestore transaction. Expires automatically when the TTL field is set to `windowStart + 2h`.

---

## Analytics MFE

### Directory Structure

```
apps/mfe/analytics/
  app/
    pages/
      analytics/
        index.vue            ← main dashboard
    components/
      SummaryCards.vue       ← visits, clicks, top product
      DailyVisitsChart.vue   ← line chart (Chart.js)
      ClicksByProductChart.vue  ← bar chart (Chart.js)
      TopProductsTable.vue   ← top 5 table
    composables/
      useAnalytics.ts        ← fetches all analytics API endpoints
    utils/
      chartConfig.ts         ← shared Chart.js config (locale, colors)
  nuxt.config.ts
  package.json
```

### SummaryCards

- **Visits this month:** count of unique `userAgentHash` per day in current month (Firestore aggregation).
- **Clicks this month:** count of documents in `businesses/{id}/clicks` where `createdAt >= month_start`.
- **Top product by clicks:** `itemId` with highest click count + product name (joined from items collection).

All three values fetched from `GET /api/owner/analytics/summary` and shown with skeleton loaders while loading.

### Charts

**DailyVisitsChart.vue** — Line chart:
- X axis: last 30 days (date labels)
- Y axis: click count
- Data from `GET /api/owner/analytics/daily?days=30`
- Renders using Chart.js `LineController`. Chart.js imported as tree-shaken: only `LineController`, `LineElement`, `PointElement`, `LinearScale`, `CategoryScale`, `Tooltip`.

**ClicksByProductChart.vue** — Bar chart:
- X axis: product names (truncated to 20 chars)
- Y axis: total clicks
- Data from `GET /api/owner/analytics/by-product`
- Shows top 10 products. If > 10, shows "Otros" as aggregated bar.

### TopProductsTable

Columns: Rank, Product Name, Clicks, % of Total

Data from `GET /api/owner/analytics/by-product` (same endpoint, sliced to top 5 in the component).

---

## Analytics API Endpoints

All under `/api/owner/analytics/*` — require `role === 'owner'` auth.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/owner/analytics/summary` | Visits this month, clicks this month, top product |
| `GET` | `/api/owner/analytics/daily?days=30` | Daily click time series (default 30 days, max 90) |
| `GET` | `/api/owner/analytics/by-product` | Total clicks per product, sorted descending |

**GET `/api/owner/analytics/summary` response:**
```json
{
  "visitsThisMonth": 1240,
  "clicksThisMonth": 387,
  "topProduct": {
    "itemId": "abc123",
    "name": "Taco de canasta",
    "clicks": 102
  }
}
```

**GET `/api/owner/analytics/daily?days=30` response:**
```json
{
  "series": [
    { "date": "2026-04-17", "clicks": 12 },
    { "date": "2026-04-18", "clicks": 19 }
  ]
}
```

**GET `/api/owner/analytics/by-product` response:**
```json
{
  "products": [
    { "itemId": "abc123", "name": "Taco de canasta", "clicks": 102 },
    { "itemId": "def456", "name": "Sopa azteca", "clicks": 74 }
  ]
}
```

---

## Super Admin Panel (`apps/ops`)

### Directory Structure

```
apps/ops/
  app/
    pages/
      index.vue              ← redirect to /businesses
      login.vue              ← Firebase Auth (superadmin only)
      businesses/
        index.vue            ← paginated list with filters
        [id].vue             ← business detail + moderation
      prospects/
        index.vue            ← all "Sí, lo quiero" submissions
      pipeline/
        index.vue            ← conversion funnel view
      metrics/
        index.vue            ← global platform metrics
    components/
      BusinessTable.vue      ← paginated, filterable, searchable
      BusinessDetail.vue     ← full info panel
      ModerationPanel.vue    ← suspend/reactivate/warn actions
      FunnelChart.vue        ← conversion funnel (draft→demo→sent→accepted→active)
      ProspectTable.vue      ← submitted prospects
      MetricsOverview.vue    ← total businesses, new this week, MRR
    composables/
      useSuperAdmin.ts       ← wrapper around all superadmin API calls
      usePagination.ts       ← generic cursor-based pagination helper
    middleware/
      superadmin.ts          ← redirect to /login if role !== 'superadmin'
  nuxt.config.ts
  package.json
```

### Business List (`businesses/index.vue`)

Filters:
- Status: All | Active | Suspended | Demo | Draft
- Type: All | (future use)
- Search: by business name (prefix match on `slug` and `name`)

Pagination: cursor-based (`startAfter` Firestore cursor), 25 per page.

Columns: Name, Slug, Status, Plan, Created At, Items Count, Actions (View detail).

### Business Detail (`businesses/[id].vue`)

Sections:
- Info: name, slug, plan, status, createdAt, owner email, phone
- Status history: timeline of status changes with timestamps and actor
- Catalog: item count, category count
- Analytics: click count (last 30 days)
- Moderation panel

### Moderation Panel (`ModerationPanel.vue`)

Actions:
- **Suspend** → `POST /api/superadmin/businesses/{id}/suspend` → sets `status = 'suspended'`. Storefront returns HTTP 410.
- **Reactivate** → `POST /api/superadmin/businesses/{id}/reactivate` → sets `status = 'active'`.
- **Send Warning Email** → `POST /api/superadmin/businesses/{id}/warn` → triggers a Firebase email function with a warning template.

All actions require a confirmation dialog with the business name typed to confirm (prevents accidental clicks).

### Conversion Funnel (`pipeline/index.vue`)

Stages: Draft → Demo Sent → Demo Accepted → Active → Churned

For each stage: count of businesses and % conversion from previous stage.

Data from `GET /api/superadmin/metrics` which returns stage counts.

**FunnelChart.vue** — horizontal bar chart (Chart.js `BarController` horizontal mode).

### Prospect List (`prospects/index.vue`)

Shows all submissions from the "Sí, lo quiero" form on the landing page.

Columns: Name, Business Name, WhatsApp, Email, Submitted At, Status (contacted / demo scheduled / converted / dropped).

Inline status update: click status cell → dropdown → `PATCH /api/superadmin/prospects/{id}`.

---

## Super Admin API Endpoints

All under `/api/superadmin/*` — require `role === 'superadmin'`. 403 if any other role (including `owner`).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/superadmin/businesses` | Paginated list; query: `status`, `cursor`, `limit=25`, `search` |
| `GET` | `/api/superadmin/businesses/{id}` | Full business detail with status history |
| `POST` | `/api/superadmin/businesses/{id}/suspend` | Set status = suspended |
| `POST` | `/api/superadmin/businesses/{id}/reactivate` | Set status = active |
| `POST` | `/api/superadmin/businesses/{id}/warn` | Trigger warning email |
| `GET` | `/api/superadmin/prospects` | All prospect submissions, ordered by createdAt desc |
| `PATCH` | `/api/superadmin/prospects/{id}` | Update prospect status |
| `GET` | `/api/superadmin/metrics` | Global metrics: totals per status, MRR, funnel counts |

**GET `/api/superadmin/businesses` response:**
```json
{
  "businesses": [
    {
      "id": "tacos-el-gordo",
      "name": "Tacos El Gordo",
      "slug": "tacos-el-gordo",
      "status": "active",
      "plan": "free",
      "createdAt": "2026-03-01T10:00:00Z",
      "itemsCount": 8
    }
  ],
  "nextCursor": "encoded_cursor_string",
  "total": 142
}
```

**GET `/api/superadmin/metrics` response:**
```json
{
  "businesses": {
    "total": 142,
    "active": 98,
    "suspended": 4,
    "demo": 12,
    "draft": 28
  },
  "newThisWeek": 7,
  "mrr": 19800,
  "funnel": {
    "draft": 28,
    "demoSent": 18,
    "demoAccepted": 14,
    "active": 98,
    "churned": 6
  }
}
```

---

## File Map

```
apps/admin/
  server/
    api/
      clicks.post.ts                  ← anonymous click tracking
      owner/
        analytics/
          summary.get.ts
          daily.get.ts
          by-product.get.ts
      superadmin/
        businesses.get.ts
        businesses/
          [id].get.ts
          [id]/
            suspend.post.ts
            reactivate.post.ts
            warn.post.ts
        prospects.get.ts
        prospects/
          [id].patch.ts
        metrics.get.ts

apps/mfe/analytics/
  app/
    pages/analytics/index.vue
    components/
      SummaryCards.vue
      DailyVisitsChart.vue
      ClicksByProductChart.vue
      TopProductsTable.vue
    composables/useAnalytics.ts
    utils/chartConfig.ts
  nuxt.config.ts
  package.json

apps/ops/
  app/
    pages/
      login.vue
      businesses/index.vue
      businesses/[id].vue
      prospects/index.vue
      pipeline/index.vue
      metrics/index.vue
    components/
      BusinessTable.vue
      BusinessDetail.vue
      ModerationPanel.vue
      FunnelChart.vue
      ProspectTable.vue
      MetricsOverview.vue
    composables/
      useSuperAdmin.ts
      usePagination.ts
    middleware/superadmin.ts
  nuxt.config.ts
  package.json

apps/storefront/
  app/
    composables/useClickTracker.ts    ← fire-and-forget click tracker
    components/ItemCard.vue           ← integrate trackClick on "Pedir" button

packages/core/src/
  types/
    analytics.ts                      ← ClickPayload, AnalyticsSummary, DailySeries
```

---

## Tasks

### Setup (both agents, day 1)

- [ ] Create `apps/mfe/analytics` with Module Federation config
- [ ] Create `apps/ops` as standalone Nuxt 4 app (no MF remote)
- [ ] Add `ClickPayload`, `AnalyticsSummary`, `DailySeries` types to `packages/core/src/types/analytics.ts`
- [ ] Add `apps/mfe/analytics` and `apps/ops` to `pnpm-workspace.yaml`
- [ ] Firestore: create TTL policy on `businesses/{id}/clicks` collection using `ttl` field (configure via Terraform, document in `infrastructure/terraform/modules/firestore/main.tf`)

### Analytics MFE Agent Tasks

- [ ] Write failing test: `clicks.post.ts` returns 204 and does not write to Firestore when rate limit exceeded (>10 same IP+item per hour)
- [ ] Implement `clicks.post.ts` with zod validation and Firestore rate limit
- [ ] Write failing test: `clicks.post.ts` sets `ttl` field to `createdAt + 90 days`
- [ ] Implement TTL field on click write
- [ ] Write failing test: `useClickTracker` does not throw when fetch fails
- [ ] Implement `useClickTracker.ts` (fire-and-forget)
- [ ] Integrate `trackClick` in `apps/storefront/app/components/ItemCard.vue`
- [ ] Write failing test: `GET /api/owner/analytics/summary` returns correct structure
- [ ] Implement `summary.get.ts`
- [ ] Write failing test: `GET /api/owner/analytics/daily?days=30` returns 30 data points
- [ ] Implement `daily.get.ts`
- [ ] Write failing test: `GET /api/owner/analytics/by-product` returns products sorted by clicks desc
- [ ] Implement `by-product.get.ts`
- [ ] Implement `DailyVisitsChart.vue` with Chart.js (tree-shaken)
- [ ] Implement `ClicksByProductChart.vue`
- [ ] Implement `SummaryCards.vue` with skeleton loaders
- [ ] Implement `TopProductsTable.vue`
- [ ] Implement `analytics/index.vue` assembling all components
- [ ] Write failing test: demo page click sets `source = 'demo'` in Firestore

### Super Admin Agent Tasks

- [ ] Write failing test: `GET /api/superadmin/businesses` returns 403 for `role === 'owner'`
- [ ] Implement superadmin auth middleware for all `/api/superadmin/*` routes
- [ ] Implement `businesses.get.ts` with cursor pagination and status filter
- [ ] Implement `businesses/[id].get.ts`
- [ ] Write failing test: `suspend.post.ts` sets `status = 'suspended'` in Firestore
- [ ] Implement `suspend.post.ts` and `reactivate.post.ts`
- [ ] Write failing test: suspended business's storefront returns HTTP 410
- [ ] Verify storefront status check logic (existing code or add to `apps/storefront/server/middleware/businessStatus.ts`)
- [ ] Implement `warn.post.ts` (trigger email via Firebase email extension)
- [ ] Implement `prospects.get.ts` and `prospects/[id].patch.ts`
- [ ] Implement `metrics.get.ts` with funnel data
- [ ] Implement `apps/ops` pages and components (see directory structure above)
- [ ] Implement `superadmin.ts` middleware
- [ ] Implement `ModerationPanel.vue` with confirmation dialog requiring business name
- [ ] Implement `FunnelChart.vue`
- [ ] Write E2E (Playwright on ops app): suspend business → verify storefront returns 410

---

## Gherkin Scenarios

### Feature: Anonymous Click Tracking

```gherkin
Feature: Anonymous click tracking
  As the platform
  I want to record customer interactions with products
  So that business owners can see what is popular

  Scenario: Customer clicks "Pedir" and click is recorded
    Given a business "tacos-el-gordo" is active
    And the storefront page for "tacos-el-gordo" is loaded
    When a customer clicks the "Pedir" button on product "Taco de canasta"
    Then a POST request is sent to "/api/clicks" with:
      | businessId    | tacos-el-gordo         |
      | itemId        | abc123                 |
      | source        | storefront             |
    And the response status is 204
    And a click document exists in Firestore at businesses/tacos-el-gordo/clicks/{id}
    And the click document has a ttl field set to 90 days from now

  Scenario: Same IP clicks same product more than 10 times in an hour
    Given a business "tacos-el-gordo" is active
    And the click_rate counter for "tacos-el-gordo"/"abc123" in the current hour is 10
    When a POST request is sent to "/api/clicks" with businessId "tacos-el-gordo" and itemId "abc123"
    Then the response status is 204
    And no new click document is written to Firestore
    And the rate counter document is not incremented beyond 10

  Scenario: Click from demo page is tagged with source "demo"
    Given a demo page is loaded at "/demo/tacos-el-gordo"
    When a visitor clicks the "Pedir" button on product "Taco de canasta"
    Then a POST request is sent to "/api/clicks" with source "demo"
    And the click document in Firestore has source = "demo"
```

### Feature: Owner Analytics

```gherkin
Feature: Owner analytics
  As a business owner
  I want to see how many people are visiting and clicking my products
  So that I can understand what is working

  Background:
    Given I am authenticated as a business owner with role "owner"
    And my business "tacos-el-gordo" has click data for the current month

  Scenario: Owner sees visit count for current month
    When I navigate to "/owner/analytics"
    Then a GET request is sent to "/api/owner/analytics/summary"
    And I see a card labeled "Visitas este mes"
    And the card shows a non-negative integer
    And the card has a skeleton loader while the data is loading

  Scenario: Owner sees top product by clicks
    Given product "Taco de canasta" has 102 clicks this month
    And all other products have fewer clicks
    When I navigate to "/owner/analytics"
    Then the "Producto más popular" card shows "Taco de canasta"
    And the card shows "102 clics"

  Scenario: Owner sees daily visits chart for last 30 days
    When I navigate to "/owner/analytics"
    Then a GET request is sent to "/api/owner/analytics/daily?days=30"
    And the line chart shows 30 data points on the X axis
    And each data point corresponds to a calendar date

  Scenario: Owner sees clicks by product bar chart
    When I navigate to "/owner/analytics"
    Then a GET request is sent to "/api/owner/analytics/by-product"
    And the bar chart shows at most 10 bars (plus "Otros" if more than 10 products)
    And the bars are sorted from highest to lowest click count
```

### Feature: Super Admin Moderation

```gherkin
Feature: Super admin moderation
  As a super admin
  I want to be able to suspend or reactivate businesses
  So that I can enforce platform policies

  Background:
    Given I am authenticated with role "superadmin"
    And I am on the ops admin panel at "ops.catalog.mx"

  Scenario: Super admin suspends active business and storefront returns 410
    Given business "tacos-el-gordo" has status "active"
    When I navigate to "/businesses/tacos-el-gordo"
    And I click "Suspender negocio"
    And I type "tacos-el-gordo" in the confirmation dialog
    And I click "Confirmar suspensión"
    Then a POST request is sent to "/api/superadmin/businesses/tacos-el-gordo/suspend"
    And the response status is 200
    And the business status in Firestore is "suspended"
    And when a customer visits "catalog.mx/tacos-el-gordo" the HTTP response status is 410
    And the 410 page shows "Este negocio no está disponible"

  Scenario: Super admin reactivates a suspended business
    Given business "tacos-el-gordo" has status "suspended"
    When I navigate to "/businesses/tacos-el-gordo"
    And I click "Reactivar negocio"
    And I confirm the action
    Then a POST request is sent to "/api/superadmin/businesses/tacos-el-gordo/reactivate"
    And the response status is 200
    And the business status in Firestore is "active"
    And when a customer visits "catalog.mx/tacos-el-gordo" the HTTP response status is 200

  Scenario: Super admin views conversion funnel percentages
    Given the platform has the following business counts:
      | stage          | count |
      | draft          | 28    |
      | demoSent       | 18    |
      | demoAccepted   | 14    |
      | active         | 98    |
      | churned        | 6     |
    When I navigate to "/pipeline"
    Then I see the funnel chart with 5 stages
    And the "Demo Sent" stage shows 64% conversion from "Draft" (18/28)
    And the "Demo Accepted" stage shows 78% conversion from "Demo Sent" (14/18)
    And the "Active" stage shows 700% growth vs "Demo Accepted" (displaying "ongoing")

  Scenario: Non-superadmin tries to access superadmin API
    Given I am authenticated with role "owner"
    When a GET request is sent to "/api/superadmin/businesses"
    Then the response status is 403
    And the response body contains error "INSUFFICIENT_ROLE"
```

---

## Definition of Done

- [ ] All Gherkin scenarios pass (Playwright E2E + Vitest unit tests)
- [ ] `pnpm typecheck` passes across all apps including `apps/ops` and `apps/mfe/analytics`
- [ ] `pnpm lint` passes with zero warnings
- [ ] Click tracking: rate limit tested in Firestore Emulator (>10 drops silently, returns 204)
- [ ] TTL field set on click documents (verified by reading back the document in test)
- [ ] `POST /api/clicks` has no auth check (verified: no Authorization header sent in test)
- [ ] `GET /api/superadmin/*` returns 403 for `role = 'owner'` (unit test)
- [ ] Suspend → 410: E2E test covers full flow (suspend via ops, visit storefront)
- [ ] `useClickTracker` swallows network errors silently (test simulates fetch failure)
- [ ] Chart.js imported tree-shaken (bundle size check: analytics MFE < 200KB gzipped)
- [ ] Confirmation dialog in `ModerationPanel` requires exact business name (tested with wrong name → button stays disabled)
- [ ] MRR shown in ops metrics is labeled "Ingreso manual" with note that it's not automated
- [ ] No PII (email, phone) logged in Cloud Logging (no `console.log(user.email)` anywhere in server code)
- [ ] MR description includes screenshot of analytics dashboard and ops business list

---

## MR Template

```markdown
## Sprint 6 — Analytics + Super Admin

### Changes
- [ ] Click tracking endpoint (`POST /api/clicks`) with rate limit
- [ ] Analytics MFE (`apps/mfe/analytics`)
- [ ] Analytics API endpoints (summary, daily, by-product)
- [ ] Super Admin app (`apps/ops`)
- [ ] Super Admin API endpoints (businesses, prospects, metrics, moderation)

### Screenshots
<!-- Analytics dashboard (owner view) -->
<!-- Super admin business list -->
<!-- Super admin business detail with moderation panel -->
<!-- Conversion funnel chart -->

### Test Coverage
- Unit: `pnpm test --filter mfe-analytics`
- Unit: `pnpm test --filter admin` (click tracking + analytics + superadmin API)
- E2E: `pnpm test:e2e --grep "Click tracking|Analytics|Super admin"`

### Checklist
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Rate limit for clicks tested (emulator)
- [ ] 403 for non-superadmin on superadmin routes
- [ ] Suspend → 410 E2E passes
- [ ] Chart.js tree-shaken (no full bundle import)
- [ ] No PII in server logs
- [ ] Target branch: `develop`
```
