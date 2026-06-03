# US-042 — Consolidate packages/ui: wire card, label, dialog; remove dead firestore.ts

| Field | Value |
|---|---|
| Epic | E19 — Platform SDK Extraction |
| Initiative | I6 — Factory SDK |
| Sprint | 16 |
| Status | 🔄 In Progress |

**As** a platform engineer, **I want** all shadcn UI primitives to live in `packages/ui` and both apps to import from there, **so that** Phase 2 SDK extraction has a clean, validated shared package to promote.

> **Depends on:** US-041 (design system homologation) ✅
> **Unlocks:** Phase 2 — factory-sdk extraction

---

## Context

`packages/ui` (`@catalog-mx/ui`) already exists and is already depended on by both apps. However:

1. `card.tsx` and `label.tsx` in admin still have their full shadcn implementation locally instead of re-exporting from the package.
2. `dialog.tsx` in storefront is a full local implementation, not wired to the package.
3. `packages/core/src/utils/firestore.ts` exports collection names (`apps`, `moments`, `analytics`) that have nothing to do with the actual schema (`businesses`, `items`) — dead code with wrong domain names, never imported anywhere.

This sprint closes those gaps so `packages/ui` is the real, complete source of truth before we promote it to `factory-sdk`.

---

## Acceptance Criteria

```gherkin
Given the monorepo build runs
When I import Card, CardHeader, CardContent, CardTitle, Label, Dialog from @catalog-mx/ui
Then those components resolve correctly with full TypeScript types

Given apps/admin-fe/src/components/ui/card.tsx
When I read it
Then it re-exports from @catalog-mx/ui (not a local implementation)

Given apps/admin-fe/src/components/ui/label.tsx
When I read it
Then it re-exports from @catalog-mx/ui

Given apps/storefront-fe/components/ui/dialog.tsx
When I read it
Then it re-exports from @catalog-mx/ui

Given packages/core/src/utils/firestore.ts
When I look for it
Then it does not exist

Given pnpm -F @catalog-mx/ui typecheck
When I run it
Then it exits 0

Given pnpm -F admin-fe typecheck
When I run it
Then it exits 0

Given pnpm -F storefront-fe typecheck
When I run it
Then it exits 0
```

---

## Subtasks

- [ ] Add `card.tsx` to `packages/ui/src/`
- [ ] Add `label.tsx` to `packages/ui/src/`
- [ ] Add `dialog.tsx` to `packages/ui/src/`
- [ ] Add `@radix-ui/react-label` and `@radix-ui/react-dialog` to `packages/ui/package.json`
- [ ] Update `packages/ui/src/index.ts` to export new components
- [ ] Replace admin `card.tsx` with re-export from `@catalog-mx/ui`
- [ ] Replace admin `label.tsx` with re-export from `@catalog-mx/ui`
- [ ] Replace storefront `dialog.tsx` with re-export from `@catalog-mx/ui`
- [ ] Delete `packages/core/src/utils/firestore.ts` and remove from `utils/index.ts`
- [ ] Run typecheck on all three packages, confirm 0 errors

## Definition of Done

- All three typechecks pass
- No local shadcn implementations remain in either app's `components/ui/` (only re-exports or truly app-specific components like `StatusBadge`)
- `packages/core/src/utils/firestore.ts` is gone
