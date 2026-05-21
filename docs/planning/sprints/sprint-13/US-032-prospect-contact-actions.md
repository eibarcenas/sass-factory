# US-032 — Prospect contact, accept, and reject actions

| Field | Value |
|---|---|
| Epic | E16 — Prospect CRM & qualification |
| Initiative | I2 — Sales Engine |
| Sprint | 13 |
| Status | ⏳ Pending |

**As** a salesperson, **I want** to act on a prospect (contact, accept, reject) directly from the admin panel, **so that** I don't need to cross-reference WhatsApp, Firestore, and the Demos list manually.

---

## State Machine

```
         ┌─────────┐
  submit │   new   │
  ──────►│ ● badge │
         └────┬────┘
              │ [Contact]
         ┌────▼──────┐
         │ contacted │
         └────┬──────┘
        ┌─────┴──────┐
   [Accept]       [Reject]
        │              │
   ┌────▼────┐   ┌─────▼────┐
   │accepted │   │ rejected │  terminal — business NOT advanced
   └────┬────┘   └──────────┘
        │ auto-advance
   ┌────▼───────────────────┐
   │ business.status →      │
   │ "accepted"             │
   └────────────────────────┘
```

Validation rules:
- `contact` requires `new`
- `accept` requires `contacted`
- `reject` requires `contacted`
- Invalid transition → HTTP 422 `{ error, from, to }`

---

## UI Wireframe

```
┌────────────────────────────────────────────────────────────────────────┐
│ Prospects                                                              │
│ People who clicked "Yes, I want it" on a demo                          │
├────────────────────────────────────────────────────────────────────────┤
│ ┌── 1 new prospect ─────────────────────────────────────────────────┐  │
│ │ 🎉  Someone wants a catalog — reach out now.                      │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │  Erick Bárcenas                  🥐 Bakery  [View demo →]         │ │
│ │  5544712575 · erick@example.com                                   │ │
│ │  Note: "Interested in: Concha, Croissant"        ● New  just now  │ │
│ │                                                                   │ │
│ │                         [Contact]   [Accept ✓]   [Reject ✗]      │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

Button states:
- `[Contact]` enabled when status = `new`; disabled after click
- `[Accept ✓]` enabled when status = `contacted`
- `[Reject ✗]` enabled when status = `contacted`

---

## Gherkin

```gherkin
Feature: Prospect CRM actions

  Background:
    Given I am logged in as admin
    And business "Bakery" is in status "Demo"
    And prospect "Erick Bárcenas" submitted "Yes, I want it" on the Bakery demo
    And the prospect status is "new"

  Scenario: Mark prospect as contacted
    When I click "Contact" on the Erick Bárcenas prospect row
    Then the prospect status changes to "contacted"
    And a "Contacted at" timestamp is stored in Firestore
    And the row badge updates from "New" to "Contacted"
    And the [Contact] button becomes disabled

  Scenario: Accept a prospect — auto-advances business pipeline
    Given the prospect status is "contacted"
    When I click "Accept" on the prospect row
    Then the prospect status changes to "accepted"
    And the Bakery business status advances from "sent" to "accepted" automatically
    And a success toast shows "Prospect accepted — Bakery is now Accepted"

  Scenario: Reject a prospect — business pipeline unchanged
    Given the prospect status is "contacted"
    When I click "Reject" on the prospect row
    Then the prospect status changes to "rejected"
    And the Bakery business status does NOT change

  Scenario: Accept blocked without prior contact
    Given the prospect status is "new"
    When I hover over [Accept]
    Then a tooltip shows "Mark as contacted first"
    And the button is disabled

  Scenario: Navigate to demo from prospect row
    When I click "View demo →" on the Erick Bárcenas row
    Then I navigate to /admin/demos#{businessId}
    And the Bakery card is scrolled into view and highlighted
```

---

## API

| Method | Path | Auth | Body | Effect |
|---|---|---|---|---|
| PATCH | `/api/v1/admin/prospects/{id}/contact` | SUPER_ADMIN | — | `status → contacted` |
| PATCH | `/api/v1/admin/prospects/{id}/accept` | SUPER_ADMIN | — | `status → accepted` + business advance |
| PATCH | `/api/v1/admin/prospects/{id}/reject` | SUPER_ADMIN | — | `status → rejected` |

---

## Subtasks

- [ ] ST-165: Add Contact/Accept/Reject buttons to `ProspectRow` component with correct disabled logic
- [ ] ST-166: `PATCH /api/v1/admin/prospects/{id}/contact` endpoint
- [ ] ST-167: `PATCH /api/v1/admin/prospects/{id}/accept` endpoint — triggers business advance to `accepted`
- [ ] ST-168: `PATCH /api/v1/admin/prospects/{id}/reject` endpoint
- [ ] ST-169: `ProspectStatus` enum + valid transitions in `packages/core/src/types/prospect.ts`
- [ ] ST-170: Unit tests for all prospect state transitions

## Definition of Done

- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests
