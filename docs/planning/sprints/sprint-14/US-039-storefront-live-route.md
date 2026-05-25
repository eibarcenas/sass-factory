# US-039 — Storefront live route fix

| Field | Value |
|---|---|
| Epic | E17 — Client Onboarding |
| Initiative | I3 — Business Catalog |
| Sprint | 14 |
| Status | ✅ Done |

**As** a visitor, **I want** to open `/{slug}` and see the business catalog, **so that** I can browse products and contact the business via WhatsApp.

> **Depends on:** nothing
> **Unlocks:** nothing (independent)

---

## Context

The storefront has two routes for a business catalog:

- `/demo/{slug}` — for demo businesses (shown during the sales pitch)
- `/{slug}` — for live businesses (the final URL the owner shares)

`/{slug}` currently returns an empty page. Two possible causes:

1. The Next.js `[slug]/page.tsx` calls `getCatalog(slug)` which hits the API. If the API is unreachable from the storefront Cloud Run instance (missing `API_URL` env var or wrong URL), `getCatalog` returns `null` → `notFound()` → blank 404 page.
2. The slug in Firestore does not match what the URL expects (e.g. data uses `heladeria-pinguino` but URL uses `heladeria-el-pinguino`).

This story diagnoses the root cause and fixes it.

---

## Expected behavior

```
GET /{slug}
  └── business exists, any status except SUSPENDED → 200, shows CatalogView
  └── business SUSPENDED                           → 410, shows suspended page
  └── business not found                           → 404, shows not found page

GET /demo/{slug}
  └── business ACTIVE or ACCEPTED                 → redirect to /{slug}
  └── any other status                             → 200, shows CatalogView with demo banner
```

---

## Diagnosis steps

1. Check `API_URL` env var on `catalog-mx-storefront-dev` Cloud Run service
2. Verify slug `heladeria-el-pinguino` exists in Firestore `businesses` collection
3. Check storefront build logs for runtime errors
4. Test `GET /api/v1/storefront/heladeria-el-pinguino` directly on the API URL

---

## Gherkin

```gherkin
Feature: Storefront live route

  Background:
    Given the API is reachable at API_URL
    And business "heladeria-el-pinguino" exists in Firestore with 3 visible items

  Scenario: Catalog loads for a business in DEMO status
    Given business "heladeria-el-pinguino" has status "demo"
    When a visitor opens /heladeria-el-pinguino
    Then the page returns 200
    And the business name and tagline are visible
    And all 3 visible items are rendered

  Scenario: Catalog loads for a business in ACTIVE status
    Given business "heladeria-el-pinguino" has status "active"
    When a visitor opens /heladeria-el-pinguino
    Then the page returns 200
    And the business name and tagline are visible

  Scenario: Catalog loads for a business in ACCEPTED status
    Given business "heladeria-el-pinguino" has status "accepted"
    When a visitor opens /heladeria-el-pinguino
    Then the page returns 200

  Scenario: Unknown slug returns 404
    Given no business exists with slug "nonexistent-business"
    When a visitor opens /nonexistent-business
    Then the page returns 404

  Scenario: Suspended business returns 410
    Given business "heladeria-el-pinguino" has status "suspended"
    When a visitor opens /heladeria-el-pinguino
    Then the page returns 410

  Scenario: Hidden items are not shown
    Given business "heladeria-el-pinguino" has 3 visible items and 2 hidden items
    When a visitor opens /heladeria-el-pinguino
    Then only 3 items are rendered
    And the 2 hidden items are not visible

  Scenario: API unreachable returns 404 gracefully
    Given the API is unreachable (timeout or connection refused)
    When a visitor opens /heladeria-el-pinguino
    Then the page returns 404 (not a 500 crash)

  Scenario: Demo route redirects to live route when business is active
    Given business "heladeria-el-pinguino" has status "active"
    When a visitor opens /demo/heladeria-el-pinguino
    Then they are redirected to /heladeria-el-pinguino
```

---

## Subtasks

- [ ] ST-174: Verify `API_URL` is set on the storefront Cloud Run service in `ei-catalog-dev`
- [ ] ST-175: Verify slug `heladeria-el-pinguino` exists in Firestore — seed if missing
- [ ] ST-176: Fix root cause (env var or slug mismatch)
- [ ] ST-177: Integration test — `GET /api/v1/storefront/{slug}` returns 200 for demo-status business

## Definition of Done

- [ ] `https://catalog-mx-storefront-dev-q3peeste7q-uc.a.run.app/heladeria-el-pinguino` returns 200 with catalog data
- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
