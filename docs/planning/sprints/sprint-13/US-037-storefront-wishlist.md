# US-037 — Storefront wishlist and WhatsApp bulk order

| Field | Value |
|---|---|
| Epic | E17 — Storefront search & wishlist |
| Initiative | I3 — Business Catalog |
| Sprint | 13 |
| Status | ⏳ Pending |

**As** a customer browsing a catalog, **I want** to save products I like and send a single WhatsApp message with everything I want, **so that** I don't have to order one item at a time.

> **Depends on:** US-036 (ProductCard layout finalized), ProspectForm from Sprint 7 (pre-fill extends existing notes field)
> **Unlocks:** nothing — final story in the storefront track

---

## State & Persistence

```
Save button clicked
      │
      ▼
localStorage["wishlist-{slug}"]
= { "concha-01": 1, "croissant-02": 2 }
      │
      │  page reload → reads localStorage → restores UI
      │
      ▼
Floating cart badge shows total item count
```

Wishlist is scoped to slug so different catalogs don't interfere.

---

## WhatsApp Message Build

```
Wishlist: Concha x1 ($18), Croissant x2 ($70), Pay de queso x1 ($45)
      │
      ▼
"Hola! Quiero ordenar de Bakery:
- Concha x1 ($18)
- Croissant de mantequilla x2 ($70)
- Pay de queso x1 ($45)
Total: $133 MXN"
      │
      ▼
wa.me/{business.whatsapp}?text={encodeURIComponent(message)}
```

---

## ProspectForm Pre-fill

```
Wishlist items → notes field pre-filled on modal open:
"Interested in: Concha, Croissant de mantequilla, Pay de queso"
(user can edit before submitting)
```

---

## UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  🥐 Bakery          CDMX      🛒 3 items    WhatsApp →           │
│                              └─ floating badge (fixed position)  │
├──────────────────────────────────────────────────────────────────┤
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                    │
│   │  [img]   │   │  [img]   │   │  [img]   │                    │
│   │ Concha   │   │Croissant │   │Pay queso │                    │
│   │ $18 MXN  │   │ $35 MXN  │   │ $45 MXN  │                    │
│   │ [♡ Save] │   │[♥ Saved] │   │ [♡ Save] │                    │
│   └──────────┘   └──────────┘   └──────────┘                    │
│                                                                  │
│    ┌──── Wishlist panel (slides up on badge click) ───────────┐  │
│    │  🛒  Your wishlist  (3 items)                        [✕] │  │
│    │  ──────────────────────────────────────────────────────  │  │
│    │  Concha           $18   [−] 1 [+]                       │  │
│    │  Croissant        $35   [−] 2 [+]                       │  │
│    │  Pay de queso     $45   [−] 1 [+]                       │  │
│    │  ─────────────────────────────────                      │  │
│    │  Total: $133 MXN                                        │  │
│    │                   [Order all via WhatsApp →]            │  │
│    └────────────────────────────────────────────────────────-┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Gherkin

```gherkin
Feature: Storefront wishlist

  Background:
    Given I am viewing the "Bakery" catalog
    And the catalog has: Concha ($18), Croissant de mantequilla ($35),
                         Pay de queso ($45)

  Scenario: Save a product to wishlist
    When I click "♡ Save" on the Concha card
    Then the button changes to "♥ Saved"
    And the floating cart badge shows "1"
    And Concha is stored in localStorage

  Scenario: Saved products persist on page reload
    Given I have saved Concha and Croissant
    When I reload the page
    Then both show "♥ Saved"
    And the cart badge shows "2"

  Scenario: Open wishlist panel
    Given I have 3 saved items
    When I click the cart badge
    Then a panel slides up showing all 3 items with name, price, and qty controls
    And a total price is displayed

  Scenario: Adjust quantity
    Given the panel is open and Croissant has qty=1
    When I click [+] on Croissant
    Then Croissant qty becomes 2
    And the total updates

  Scenario: Remove item at qty 0
    Given the panel is open
    When I click [−] on Concha until qty reaches 0
    Then Concha is removed from the wishlist
    And the badge decrements

  Scenario: Order all via WhatsApp
    Given the wishlist has Concha x1 and Croissant x2
    When I click "Order all via WhatsApp →"
    Then the browser opens WhatsApp with:
      """
      Hola! Quiero ordenar de Bakery:
      - Concha x1 ($18)
      - Croissant de mantequilla x2 ($70)
      Total: $88 MXN
      """

  Scenario: Prospect form pre-fills notes from wishlist
    Given I have Concha and Pay de queso in my wishlist
    When I click "Yes, I want it" and the ProspectForm opens
    Then the notes field reads "Interested in: Concha, Pay de queso"
    And the user can edit the notes before submitting
```

---

## Subtasks

- [ ] ST-187: Create `useWishlist` composable — localStorage persistence keyed by `wishlist-{slug}`
- [ ] ST-188: Add save/unsave toggle to `ProductCard` with filled/outline heart icon
- [ ] ST-189: Create floating `CartBadge` component — fixed position, shows total item count
- [ ] ST-190: Create `WishlistPanel` slide-up component — qty controls, total, order button
- [ ] ST-191: Build WhatsApp message string from wishlist items and open `wa.me` link
- [ ] ST-192: Pre-fill `ProspectForm` notes field from wishlist item names on modal open

## Definition of Done

- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests
