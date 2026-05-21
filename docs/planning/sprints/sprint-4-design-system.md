# Sprint 4 — Design System (shadcn/ui)

| Field | Value |
|---|---|
| Branch | `sprint/4-design-system` from `develop` |
| Status | ✅ Done |
| Stack | shadcn/ui, Tailwind CSS, Radix UI |
| Initiatives | Platform Core (US-003, US-004) |
| Pre-condition | Sprint 3 merged to `develop` |

---

## Objective

Establish a consistent visual language across admin and storefront using shadcn/ui. Replace ad-hoc Tailwind patterns with shared primitives. Ship `StatusBadge` as the single source of truth for business status colors.

Not a separate package — components live inside each app (`apps/admin/src/components/ui/`, `apps/storefront/components/ui/`). shadcn/ui copies source into the project, not a runtime dependency.

---

## Components Added

### Admin (`apps/admin/src/components/ui/`)

| Component | Source | Usage |
|---|---|---|
| `Button` | shadcn | Primary CTAs, form actions |
| `Input` | shadcn | Form fields |
| `Card` | shadcn | Business cards, product cards |
| `Badge` | shadcn | Tags, labels |
| `Dialog` | shadcn | Confirmation modals |
| `Skeleton` | shadcn | Loading states |
| `StatusBadge` | custom | Business status pill (draft/demo/sent/accepted/active/suspended) |

### Storefront (`apps/storefront/components/ui/`)

| Component | Source | Usage |
|---|---|---|
| `Button` | shadcn | WhatsApp CTA, form submit |
| `Badge` | shadcn | Category filters, price labels |
| `Separator` | shadcn | Section dividers |
| `Dialog` | shadcn | Product modal |

---

## StatusBadge Color Map

```typescript
const STATUS_COLORS: Record<BusinessStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  demo:      'bg-blue-100 text-blue-700',
  sent:      'bg-yellow-100 text-yellow-700',
  accepted:  'bg-green-100 text-green-700',
  active:    'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  expired:   'bg-orange-100 text-orange-700',
  archived:  'bg-gray-100 text-gray-400',
}
```

---

## Tailwind Config (Design Tokens)

```typescript
// tailwind.config.ts — custom tokens
extend: {
  colors: {
    brand: { DEFAULT: '#6366f1', dark: '#4f46e5' },
  },
  borderRadius: {
    xl: '0.75rem',
    '2xl': '1rem',
  }
}
```

---

## Tests

### Unit (Vitest)
- `StatusBadge` renders correct text and CSS class for each of the 8 statuses
- `StatusBadge` with unknown status does not throw
- `Button` renders disabled state with `opacity-50` and `pointer-events-none`

### Visual regression (optional — Playwright screenshot)
- StatusBadge row renders correctly at 1280×720
- Product card renders with and without image

---

## Acceptance Criteria

- [ ] `StatusBadge` shows correct color for all 8 business statuses
- [ ] All admin forms use `Input` component (no raw `<input>` with ad-hoc styles)
- [ ] Confirmation dialogs use `Dialog` component
- [ ] Loading states use `Skeleton` (no blank spaces)
- [ ] `pnpm typecheck` passes with zero errors
