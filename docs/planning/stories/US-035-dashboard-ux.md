# US-035 — Dashboard quick-create button and pipeline action labels

| Field | Value |
|---|---|
| Epic | E6 — Business status lifecycle |
| Initiative | I2 — Sales Engine |
| Sprint | 13 |
| Status | ⏳ Pending |

**As** a salesperson, **I want** the "+ New demo" button always visible at the top of the dashboard and pipeline action labels that clearly explain what they do, **so that** I can act fast without hunting for controls or guessing what a button means.

---

## Button Placement

```
Before                                    After
──────────────────────────────            ──────────────────────────────────────
 Dashboard                                 Dashboard              [+ New demo]
 Sales pipeline overview                   Sales pipeline overview

 ┌──────────┐ ┌──────────┐ ┌──────────┐   ┌──────────┐ ┌──────────┐ ┌──────────┐
 │ ACTIVE   │ │IN PIPELINE│ │   NEW    │   │ ACTIVE   │ │IN PIPELINE│ │   NEW    │
 │    1     │ │    3      │ │PROSPECTS │   │    1     │ │    3      │ │PROSPECTS │
 └──────────┘ └──────────┘ │    1     │   └──────────┘ └──────────┘ │    1  →  │
                           └──────────┘                              └──────────┘
 Quick create demo                                                   (clickable)
              [+ New demo]  ← buried at bottom
```

---

## Pipeline Action Labels

| Current label | New label | Tooltip |
|---|---|---|
| Publish demo | Publish demo | Makes the demo URL public — prospect can view the catalog |
| Mark as sent | Sent to prospect | Record that you shared the demo link with the prospect |
| Mark accepted | Mark accepted | Prospect verbally agreed — moves to contract stage |
| Activate | Activate | Creates owner account and goes live at catalog.mx/slug |
| Suspend | Suspend | Temporarily hides catalog — owner retains their data |
| Reactivate | Reactivate | Restores catalog visibility for the owner |

---

## Gherkin

```gherkin
Feature: Dashboard UX quick actions

  Scenario: New demo button is in the page header
    Given I navigate to the Dashboard
    Then I see a "+ New demo" button in the top-right of the page header
    And I do NOT need to scroll to find it

  Scenario: New demo button also appears on Demos page header
    Given I navigate to /admin/demos
    Then I see a "+ New demo" button in the top-right of the page header

  Scenario: NEW PROSPECTS stat card is clickable
    Given there is 1 new prospect
    When I click the "NEW PROSPECTS 1" card
    Then I navigate to /admin/prospects

  Scenario: Renamed action button label
    Given a business is in "Demo" status
    When I view its card
    Then the action button reads "Sent to prospect"
    And NOT "Mark as sent"

  Scenario: Action button tooltip appears on hover
    When I hover over "Sent to prospect"
    Then a tooltip shows "Record that you shared the demo link with the prospect"
```

---

## Subtasks

- [ ] ST-179: Move "+ New demo" button to page header top-right on Dashboard and Demos pages
- [ ] ST-180: Rename "Mark as sent" → "Sent to prospect"; add tooltip copy for all 6 pipeline actions
- [ ] ST-181: Make Dashboard stat cards clickable with correct navigation targets

## Definition of Done

- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests
