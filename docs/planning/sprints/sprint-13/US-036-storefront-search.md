# US-036 — Storefront product search by name

| Field | Value |
|---|---|
| Epic | E17 — Storefront search & wishlist |
| Initiative | I3 — Business Catalog |
| Sprint | 13 |
| Status | ⏳ Pending |

**As** a customer browsing a catalog, **I want** to search products by name, **so that** I can find what I need without scrolling the full grid.

---

## Filter Logic

```
User types query
      │
      ▼  client-side (no API call)
      │
      ├── normalize: query.toLowerCase().trim()
      │
      ├── match: product.name.includes(q) OR product.category.includes(q)
      │
      ├── compose with active category filter (AND)
      │
      └── 0 results → empty state + [Clear search]
```

No debounce needed — filter is synchronous over an in-memory array.

---

## UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  🥐 Bakery                              CDMX       WhatsApp →   │
├──────────────────────────────────────────────────────────────────┤
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  🔍  Search products...                              ✕   │   │
│   └──────────────────────────────────────────────────────────┘   │
│   All   Pan dulce   Croissants   Panes                           │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│   │  [img]   │  │  [img]   │  │  [img]   │  │  [img]   │        │
│   │ Concha   │  │Croissant │  │Pay queso │  │ Bolillo  │        │
│   │ $18 MXN  │  │ $35 MXN  │  │ $45 MXN  │  │  $8 MXN  │        │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│   — after typing "cro" ────────────────────────────────────      │
│   ┌──────────┐                                                   │
│   │  [img]   │                                                   │
│   │Croissant │   (no other results)                              │
│   │ $35 MXN  │                                                   │
│   └──────────┘                                                   │
│                                                                  │
│   — after typing "xyzabc" ─────────────────────────────────      │
│   No products match "xyzabc"                [Clear search]       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Gherkin

```gherkin
Feature: Storefront product search

  Background:
    Given I am viewing the "Bakery" catalog
    And the catalog has: Concha ($18), Croissant de mantequilla ($35),
                         Pay de queso ($45), Bolillo ($8)

  Scenario: Search filters products in real time
    When I type "cro" in the search bar
    Then only "Croissant de mantequilla" is displayed
    And the update happens without a page reload

  Scenario: Search is case-insensitive
    When I type "CONCHA"
    Then "Concha" appears in results

  Scenario: Search composes with category filter (AND)
    Given I have selected category "Pan dulce"
    When I type "pay"
    Then only products matching both "Pan dulce" AND containing "pay" are shown

  Scenario: Zero results shows empty state
    When I type "xyzabc"
    Then the grid shows "No products match 'xyzabc'"
    And a "Clear search" link is shown

  Scenario: Clear button resets to full catalog
    Given I typed "cro" and only Croissant is shown
    When I click ✕ in the search bar
    Then all products are shown
    And the search input is empty

  Scenario: Search input is accessible
    When the page loads
    Then the search input has aria-label="Search products"
```

---

## Subtasks

- [ ] ST-182: Add `SearchBar` component to storefront catalog header
- [ ] ST-183: Implement `useProductSearch` composable — filters `visibleProducts` by query string
- [ ] ST-184: Compose search filter with existing category filter (AND logic)
- [ ] ST-185: Add empty state UI with "No products match" message and clear action
- [ ] ST-186: Unit tests for `useProductSearch` composable

## Definition of Done

- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests
