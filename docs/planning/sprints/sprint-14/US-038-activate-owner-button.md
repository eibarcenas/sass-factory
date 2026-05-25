# US-038 — Activate owner button in DemoCard

| Field | Value |
|---|---|
| Epic | E17 — Client Onboarding |
| Initiative | I2 — Sales Engine |
| Sprint | 14 |
| Status | ✅ Done |

**As** a SUPER_ADMIN, **I want** an "Activate owner" button on each demo card, **so that** I can give a client access to their panel without leaving the admin dashboard.

> **Depends on:** nothing
> **Unlocks:** US-040 (preview needs a real activated owner to test end-to-end)

---

## Context

`CreateOwnerModal` already exists and calls `POST /api/v1/admin/owners` to set Firebase custom claims. The problem: there is no button in `DemoList` / `DemoCard` that opens it. The feature is built but invisible.

---

## UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  🍦  Heladería El Pingüino                        ● Demo    ▼   │
│      heladeria · Monterrey                                       │
│      "La mejor heladería artesanal"                             │
│                                                                  │
│   View demo →          [Activate owner]   [Mark as sent]        │
└──────────────────────────────────────────────────────────────────┘

After clicking "Activate owner":

┌──────────────────────────────────────────────────────────────────┐
│  Activate owner                                                  │
│  Heladería El Pingüino                                          │
│  ─────────────────────────────────────────────────────────────  │
│  Owner's Google email                                           │
│  [ owner@gmail.com                                            ] │
│  Must be a Google account they'll use to sign in.              │
│                                                                  │
│           [  Activate  ]   [ Cancel ]                           │
└──────────────────────────────────────────────────────────────────┘

After success:

┌──────────────────────────────────────────────────────────────────┐
│  ✅ Owner activated!                                             │
│  Send this to owner@gmail.com:                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Your catalog is ready! 🎉                                  │ │
│  │ Log in here with your Google account:                      │ │
│  │ https://catalog-mx-admin-dev-....run.app                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                              [  Done  ]                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Gherkin

```gherkin
Feature: Activate owner from DemoCard

  Background:
    Given I am logged in as SUPER_ADMIN
    And business "Heladería El Pingüino" exists with id "heladeria-el-pinguino" in status "demo"

  Scenario: Button is visible on every DemoCard regardless of status
    Given businesses exist in statuses "draft", "demo", "sent", "accepted", "active"
    When I open the Demos page
    Then every DemoCard shows an "Activate owner" button

  Scenario: Opening the modal
    When I click "Activate owner" on the Heladería card
    Then the CreateOwnerModal opens
    And the modal title shows "Activate owner"
    And the modal subtitle shows "Heladería El Pingüino"
    And the email input is empty and focused

  Scenario: Successful activation
    Given the modal is open
    When I enter "owner@gmail.com" in the email field
    And I click "Activate"
    Then POST /api/v1/admin/owners is called with { email: "owner@gmail.com", businessId: "heladeria-el-pinguino" }
    And the modal shows the success state
    And the success state shows the admin URL to send to the client
    And a "Done" button closes the modal

  Scenario: Activate button disabled with empty email
    Given the modal is open
    And the email field is empty
    Then the "Activate" button is disabled

  Scenario: Invalid email format
    Given the modal is open
    When I enter "not-an-email" in the email field
    And I click "Activate"
    Then the API is NOT called
    And an inline error shows "Enter a valid email"

  Scenario: API error during activation
    Given the modal is open
    And the API will return 500
    When I enter "owner@gmail.com" and click "Activate"
    Then an inline error shows the API error message
    And the modal stays open so the admin can retry

  Scenario: Cancel closes the modal without API call
    Given the modal is open
    When I click "Cancel"
    Then the modal closes
    And POST /api/v1/admin/owners is NOT called

  Scenario: Clicking outside the modal closes it
    Given the modal is open
    When I click the backdrop outside the modal
    Then the modal closes
    And POST /api/v1/admin/owners is NOT called
```

---

## Subtasks

- [ ] ST-171: Add `showOwnerModal` state + "Activate owner" button to `DemoCard` in `DemoList.tsx`
- [ ] ST-172: Import and render `CreateOwnerModal` inside `DemoCard` when `showOwnerModal` is true
- [ ] ST-173: Vitest — "Activate owner" button renders and toggles modal

## Definition of Done

- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] Every DemoCard in all statuses shows the button
