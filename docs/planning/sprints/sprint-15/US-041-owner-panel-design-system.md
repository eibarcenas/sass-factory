# US-041 — Owner panel follows admin design system

| Field | Value |
|---|---|
| Epic | E18 — Design System |
| Initiative | I5 — Product Quality |
| Sprint | 15 |
| Status | ✅ Done |

**As** a product owner, **I want** the owner/client panel to use the same visual components and patterns as the super admin panel, **so that** both surfaces feel like one product and new features never introduce inconsistency.

> **Depends on:** nothing
> **Unlocks:** all future panel work (design rule is in place before new stories ship)

---

## Context

The admin panel (`apps/admin-fe/src/components/ui/`) owns the design system: `Card`, `Input`, `Label`, `Button`, `Badge`, `Separator`. The owner panel (`OwnerDashboardPage`) already uses these correctly. The violation is in the public storefront's internal UI — `ProspectModal` uses raw `<input>` elements with ad-hoc classes instead of the `Input` component.

Additionally, `CLAUDE.md` does not document the design rule, so every new sprint risks re-introducing inconsistency.

**Two-part fix:**
1. Copy `Input` to `apps/storefront-fe/components/ui/` and update `ProspectModal`.
2. Add a Design System section to `CLAUDE.md` that acts as a standing rule.

---

## UI Wireframe

**Before** — ProspectModal raw input:
```
┌─────────────────────────────────────────┐
│  Tell us about you                      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Your name           (ad-hoc px) │    │  ← raw <input> rounded-xl
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Phone / WhatsApp *              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**After** — ProspectModal using `<Input>` component:
```
┌─────────────────────────────────────────┐
│  Tell us about you                      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Your name           (token px)  │    │  ← <Input> rounded-md ring-offset
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Phone / WhatsApp *              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

The visual change is subtle (rounded-xl → rounded-md, focus ring uses `ring-ring` token). The structural change is that both panels now derive from one source of truth.

---

## Design System Rule (to be added to CLAUDE.md)

```
## Design System

Source of truth: apps/admin-fe/src/components/ui/
Rule: any panel UI (admin or owner) MUST use these components.
      Never use raw <input>/<button>/<div> when a component exists.

Components
  Card / CardHeader / CardTitle / CardContent  → section containers
  Input + Label                                → all form fields
  Button (size + variant)                      → all actions
  Badge                                        → status labels
  Separator                                    → visual dividers

Tokens (identical in both apps, never hardcode):
  bg-muted, text-muted-foreground, border-input, ring-ring
  bg-primary/10, text-primary, bg-destructive

Border radius:
  rounded-lg  → panels, cards, form elements (admin + owner)
  rounded-2xl → customer-facing product cards only (storefront catalog)

When adding a component to storefront/components/ui/:
  Copy the file verbatim from apps/admin-fe/src/components/ui/.
  Do not diverge styling. Add only the @radix-ui/* dep if it's not already in storefront/package.json.
```

---

## Gherkin

```gherkin
Feature: Owner panel design consistency

  Background:
    Given the storefront ProspectModal is rendered

  Scenario: ProspectModal inputs use the shared Input component
    When I inspect the input fields in ProspectModal
    Then each field renders the shared <Input> component
    And no raw <input> with ad-hoc className exists in ProspectModal

  Scenario: Input focus ring uses the design token
    When I focus the "Phone / WhatsApp *" field
    Then the focus ring uses "ring-ring" (CSS var), not a hardcoded color

  Scenario: CLAUDE.md contains the Design System section
    When I open CLAUDE.md
    Then a "Design System" section exists
    And it names apps/admin-fe/src/components/ui/ as the source of truth
    And it lists the border-radius rule for panels vs product cards
```

---

## Subtasks

- [x] ST-174: Add `input.tsx` to `apps/storefront-fe/components/ui/` — verbatim copy from admin
- [x] ST-175: Update `ProspectModal` in `CatalogView.tsx` to use `<Input>` (import + replace 3 raw inputs)
- [x] ST-176: Add `## Design System` section to root `CLAUDE.md` with the rule above

## Definition of Done

- [x] `apps/storefront-fe/components/ui/input.tsx` exists and matches admin version
- [x] `ProspectModal` contains zero raw `<input>` elements
- [x] `CLAUDE.md` has a Design System section naming the source-of-truth directory
- [x] `pnpm typecheck` passes with zero errors
