# US-040 — SUPER_ADMIN preview of owner dashboard

| Field | Value |
|---|---|
| Epic | E17 — Client Onboarding |
| Initiative | I4 — Ops & Internal Tools |
| Sprint | 14 |
| Status | ✅ Done |

**As** a SUPER_ADMIN, **I want** to preview any client's owner dashboard by clicking "Preview" on a DemoCard, **so that** I can verify what the client sees without needing to log in as them.

> **Depends on:** US-038 (activate owner button ships first; preview is tested end-to-end with an activated account)
> **Unlocks:** nothing

---

## Context

The `/owner` route requires `role === OWNER` — SUPER_ADMIN gets redirected to `/`.
SUPER_ADMIN needs a separate read-only route that loads the owner dashboard for any business by slug.

The API owner endpoints also require `role === OWNER`. They need to additionally accept `role === SUPER_ADMIN` with a `?business=<slug>` query param override.

---

## UI Wireframe

```
DemoCard with new "Preview" button:

┌──────────────────────────────────────────────────────────────────┐
│  🍦  Heladería El Pingüino                        ● Demo    ▼   │
│      heladeria · Monterrey                                       │
│                                                                  │
│   View demo →   [Preview panel]  [Activate owner]  [Mark sent]  │
└──────────────────────────────────────────────────────────────────┘

Clicking "Preview panel" opens:
  /owner/preview/heladeria-el-pinguino

Which renders OwnerDashboardPage with:

┌──────────────────────────────────────────────────────────────────┐
│ ┌── 🔍 Previewing as owner ────────────────────────────────────┐ │
│ │  You are viewing this as SUPER_ADMIN. Read-only mode.        │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Heladería El Pingüino                              ● Demo      │
│  ─────────────────────────────────────────────────────────────  │
│  Your catalog link                                              │
│  [ https://storefront.../demo/heladeria-el-pinguino ]  [Copy]  │
│                                                                  │
│  Products (3)                                                   │
│  Sundae de chocolate .............. $85 MXN   (read-only)      │
│  Nieve de vainilla ................ $40 MXN   (read-only)      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Routing

```
/owner                        → RequireOwner (OWNER only)
/owner/preview/:slug          → RequireSuperAdmin only
                                renders OwnerDashboardPage with slug from URL
                                all edit actions disabled (read-only)
```

---

## API changes

Owner endpoints currently: `require_role(Role.OWNER)` — reads `business_id` from JWT.

New behavior:
- `OWNER` → use `user.business_id` from JWT (unchanged)
- `SUPER_ADMIN` + `?business=<slug>` → use slug from query param
- `SUPER_ADMIN` without slug → 400 Bad Request

Endpoints affected:
- `GET /owner/business/items`
- `POST /owner/business/items`
- `PATCH /owner/business/items/{item_id}`
- `DELETE /owner/business/items/{item_id}`
- `PATCH /owner/business`

---

## Gherkin

```gherkin
Feature: SUPER_ADMIN owner dashboard preview

  Background:
    Given business "heladeria-el-pinguino" exists with 3 items

  # ── Frontend routing ──────────────────────────────────────────────

  Scenario: Preview button visible on every DemoCard
    Given I am logged in as SUPER_ADMIN
    When I open the Demos page
    Then each DemoCard shows a "Preview panel" button

  Scenario: SUPER_ADMIN navigates to preview route
    Given I am logged in as SUPER_ADMIN
    When I click "Preview panel" on the Heladería El Pingüino card
    Then I am taken to /owner/preview/heladeria-el-pinguino
    And a "Previewing as owner" banner is visible at the top
    And all product edit buttons (✏️ and 🗑️) are disabled
    And the tagline "Save" button is disabled
    And "+ Add product" button is not shown

  Scenario: OWNER visiting /owner/preview/:slug is redirected to /owner
    Given I am logged in as OWNER with business "heladeria-el-pinguino"
    When I navigate to /owner/preview/heladeria-el-pinguino
    Then I am redirected to /owner

  Scenario: Unauthenticated user visiting /owner/preview/:slug is redirected to /login
    Given I am not logged in
    When I navigate to /owner/preview/heladeria-el-pinguino
    Then I am redirected to /login

  Scenario: Unknown slug shows 404 state
    Given I am logged in as SUPER_ADMIN
    When I navigate to /owner/preview/nonexistent-business
    Then the page shows a "Business not found" error

  # ── API ───────────────────────────────────────────────────────────

  Scenario: SUPER_ADMIN with valid business slug gets items
    When SUPER_ADMIN calls GET /api/v1/owner/business/items?business=heladeria-el-pinguino
    Then the response is 200
    And the response contains 3 items

  Scenario: SUPER_ADMIN without business slug is rejected
    When SUPER_ADMIN calls GET /api/v1/owner/business/items (no ?business= param)
    Then the response is 400
    And the error says "business query param required for SUPER_ADMIN"

  Scenario: OWNER gets their own items without slug param
    Given I am logged in as OWNER with business_id "heladeria-el-pinguino" in JWT claims
    When OWNER calls GET /api/v1/owner/business/items (no ?business= param)
    Then the response is 200
    And the response contains the owner's items

  Scenario: OWNER cannot override business slug via query param
    Given I am logged in as OWNER with business_id "heladeria-el-pinguino" in JWT claims
    When OWNER calls GET /api/v1/owner/business/items?business=another-business
    Then the response is 403

  Scenario: Unauthenticated call to owner endpoint is rejected
    When GET /api/v1/owner/business/items is called with no Authorization header
    Then the response is 401
```

---

## Subtasks

- [ ] ST-178: Add `RequireSuperAdmin` guard to new `/owner/preview/:slug` route in `App.tsx`
- [ ] ST-179: `OwnerDashboardPage` — read slug from URL param when role is SUPER_ADMIN; show read-only banner
- [ ] ST-180: Disable all edit mutations in `OwnerDashboardPage` when in preview mode
- [ ] ST-181: Add "Preview panel" button to `DemoCard` in `DemoList.tsx`
- [ ] ST-182: API — owner endpoints accept SUPER_ADMIN + `?business=<slug>` override; return 400 if missing
- [ ] ST-183: Integration tests — SUPER_ADMIN with/without slug param
- [ ] ST-184: Vitest — preview mode renders banner and disables edits

## Definition of Done

- [ ] SUPER_ADMIN sees read-only owner dashboard at `/owner/preview/:slug`
- [ ] OWNER visiting `/owner/preview/:slug` is redirected to `/owner`
- [ ] API returns 200 for SUPER_ADMIN + valid slug, 400 for SUPER_ADMIN + no slug
- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
