# US-033 — Demo card shows prospect activity and links bidirectionally to Prospects

| Field | Value |
|---|---|
| Epic | E16 — Prospect CRM & qualification |
| Initiative | I2 — Sales Engine |
| Sprint | 13 |
| Status | ⏳ Pending |

**As** a salesperson, **I want** to see prospect signals on each demo card and navigate between demos and their prospects in both directions, **so that** I never lose context switching pages.

---

## Data Model Change

`businesses/{id}` gains two denormalized fields, updated atomically every time a prospect is written:

```
prospectCount:   number     incremented on each new prospect
lastProspectAt:  timestamp
```

---

## Navigation Diagram

```
Demos page
  └── Demo card
        └── "👤 2 prospects [view →]"
              │
              ▼
        /admin/prospects?businessId={id}
              │
              └── ProspectRow "View demo →"
                    │
                    ▼
              /admin/demos#{businessId}
              (card scrolled + 2s highlight border)
```

---

## UI Wireframe

```
┌─── Demo card (status: Demo, 2 prospects) ───────────────────────┐
│  🥐 Bakery                           ● Demo           [▼]       │
│     panaderia · CDMX                                            │
│     "hola"                                                      │
│                                                                 │
│     👤 2 prospects  [view →]                                    │
│                                                                 │
│  [View demo →]            [Sent to prospect]                    │
└─────────────────────────────────────────────────────────────────┘

┌─── Demo card (prospect accepted) ───────────────────────────────┐
│  🍦 Heladería XYZ                    ● Sent           [▼]       │
│                                                                 │
│     👤 1 prospect  ✓ Accepted  [view →]                         │
│                                                                 │
│  [View demo →]            [Mark accepted]                       │
└─────────────────────────────────────────────────────────────────┘

┌─── Demo card (0 prospects) ─────────────────────────────────────┐
│  🍕 Panadería Nueva                  ● Draft          [▼]       │
│     (no badge rendered)                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Gherkin

```gherkin
Feature: Bidirectional demo-prospect navigation

  Scenario: Demo card shows prospect count badge
    Given business "Bakery" has 2 prospects in Firestore
    When I view the Demos page
    Then the Bakery card shows "👤 2 prospects"

  Scenario: Clicking badge navigates to filtered Prospects page
    When I click "view →" on the Bakery prospect badge
    Then I navigate to /admin/prospects?businessId=bakery-01
    And only Bakery's prospects are shown
    And a "← Back to Bakery demo" breadcrumb is visible

  Scenario: Badge shows inline prospect status when accepted
    Given one of Bakery's prospects has status="accepted"
    When I view the Bakery demo card
    Then the badge shows "✓ Accepted" in green

  Scenario: No badge when business has zero prospects
    Given business "Panadería Nueva" has 0 prospects
    When I view its card
    Then no prospect badge is rendered

  Scenario: Navigate from Prospect row back to its Demo
    Given I am on the Prospects page
    When I click "View demo →" on a prospect row
    Then I navigate to /admin/demos#{businessId}
    And the card scrolls into view with a 2-second highlight border
```

---

## Subtasks

- [ ] ST-171: Add `prospectCount` and `lastProspectAt` to business Firestore doc — updated atomically on prospect write
- [ ] ST-172: Render prospect badge on `DemoCard` using `prospectCount`; show inline status when prospect is `accepted`
- [ ] ST-173: Add `?businessId=` filter support to Prospects page + breadcrumb back link
- [ ] ST-174: Implement scroll-to + highlight animation on `DemoCard` when navigated via hash

## Definition of Done

- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests
