# US-034 — Prospect vs. client distinction

| Field | Value |
|---|---|
| Epic | E16 — Prospect CRM & qualification |
| Initiative | I2 — Sales Engine |
| Sprint | 13 |
| Status | ⏳ Pending |

**As** a salesperson, **I want** active businesses and their owners labeled as clients (not prospects), **so that** I don't treat paying customers as cold leads.

---

## Lifecycle: Prospect → Client

```
prospect submits "Yes, I want it"
          │
          ▼
  prospect.status = "new"
  business.status = unchanged
          │
          │  admin accepts
          ▼
  prospect.status = "accepted"
  business.status → "accepted"
          │
          │  admin activates
          ▼
  business.status = "active"
  prospect label → "Client"   ← UI label only, no new collection
  shown under CLIENTS in sidebar
```

---

## Sidebar Restructure

```
Before                          After
──────────────────              ─────────────────────────────
 Dashboard                       Dashboard
 Demos                           Demos
 Prospects  ● 1                  Prospects  ● 1
                                 Clients
 PIPELINE                        PIPELINE
  Draft   0                       Draft      0
  Demo    3                       Demo       3
  Sent    0                       Sent       0
  Accepted 0                      Accepted   0
  Active  1  ← mixed with leads   ────────────────
                                 CLIENTS
                                  Active     1   ← promoted
```

Rule: `status === "active"` businesses are excluded from PIPELINE counts and appear under CLIENTS. Their associated prospect (status = `accepted`) moves to `/admin/clients`, not `/admin/prospects`.

---

## Gherkin

```gherkin
Feature: Prospect vs client labeling

  Scenario: Active business prospect shown as client
    Given business "Bakery" has status="active"
    And prospect "Erick Bárcenas" has status="accepted" for Bakery
    When I view the sidebar
    Then CLIENTS shows count 1
    And PIPELINE Active shows 0
    And "Erick Bárcenas" does NOT appear on /admin/prospects
    But appears on /admin/clients

  Scenario: Pipeline counts exclude active businesses
    Given there are 2 Demo businesses and 1 Active business
    When I view the sidebar
    Then PIPELINE shows: Draft 0, Demo 2, Sent 0, Accepted 0
    And CLIENTS shows: Active 1

  Scenario: Prospect in accepted status stays on Prospects page until activation
    Given business "Panadería XYZ" has status="accepted" (not yet active)
    And its prospect status is "accepted"
    When I view the Prospects page
    Then the prospect appears with "Accepted" badge
    And does NOT appear on /admin/clients yet

  Scenario: Dashboard NEW PROSPECTS card navigates to Prospects
    Given there is 1 new prospect
    When I click the "NEW PROSPECTS 1" stat card
    Then I navigate to /admin/prospects
```

---

## Subtasks

- [ ] ST-175: Split sidebar into PIPELINE and CLIENTS sections using `status === "active"` as boundary
- [ ] ST-176: Create `/admin/clients` page — active businesses + their accepted prospects
- [ ] ST-177: Make all three Dashboard stat cards clickable with correct navigation targets
- [ ] ST-178: Unit tests for sidebar count logic (pipeline vs client split)

## Definition of Done

- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests
