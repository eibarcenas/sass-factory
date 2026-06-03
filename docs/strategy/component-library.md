# Component Library Strategy — @sass-factory/ui

> **Goal:** Components built for this SaaS project are publishable to GitHub Packages so that future projects by the same team can consume them without copying code, without forking the repo, and without tight coupling to business logic.

---

## 1. Problem Statement

A typical SaaS team rebuilds the same UI components in every project: buttons, inputs, modals, badges, tables. Each rebuild introduces subtle inconsistencies, costs sprint time, and creates divergent codebases that drift apart over time. The alternative — a shared component library published as a versioned package — pays its setup cost once and delivers compounding returns across every future project.

This strategy defines how the existing `packages/ui` package evolves from an internal utility into a publishable, versioned, consumer-ready component library, without sacrificing the speed of feature development in the current project.

---

## 2. Three-Tier Component Classification

Not all components belong in a shared library. The classification below determines where each component lives and whether it is published.

### Tier 1 — Generic / Primitive

**Definition:** Stateless, unstyled or minimally styled, zero business logic, usable in any Vue 3 project regardless of domain.

**Published to GitHub Packages:** Yes

**Examples:**

| Component | Description |
|-----------|-------------|
| `Button` | Variants: primary, secondary, ghost, destructive. Sizes: sm, md, lg. |
| `Input` | Text, number, password. Error state, label, hint. |
| `Textarea` | Autoresize, character count, error state. |
| `Modal` | Teleport-based. Focus trap. Keyboard dismiss. |
| `Card` | Container with header, body, footer slots. |
| `Badge` | Color variants via prop. No status semantics. |
| `Toast` | Composable-based. Position, duration, dismiss. |
| `Skeleton` | Width, height, rounded variants. |
| `Table` | Slot-based rows. Sort indicators. Empty state. |
| `Tabs` | Controlled and uncontrolled. Keyboard navigation. |
| `Spinner` | Size and color variants. |
| `Avatar` | Image with fallback initials. |
| `Tooltip` | Floating UI based. |
| `Dropdown` | Trigger + items. Keyboard navigable. |

**Rule for Tier 1:** If the component imports anything from `@sass-factory/core` types, it does not belong in Tier 1. Tier 1 has zero dependencies on domain models.

---

### Tier 2 — Lightly Opinionated

**Definition:** Built on Tier 1 primitives, adds light opinions (formatting, state semantics, validation) that are configurable via props. Still domain-agnostic enough to be useful across projects.

**Published to GitHub Packages:** Yes (with configurable props)

**Examples:**

| Component | Description |
|-----------|-------------|
| `StatusBadge` | Extends `Badge`. Accepts `status` prop (`active`, `inactive`, `pending`, `error`). Color mapping is prop-driven, not hardcoded. |
| `PriceDisplay` | Formats numbers as currency. Defaults to MXN (`es-MX` locale). Accepts `locale` and `currency` props to override. |
| `ImageUpload` | File input with drag-and-drop. Accepts `maxSize`, `accept`, `multiple` props. Emits `file:selected` and `file:error`. Does NOT hardcode upload endpoints. |
| `DataTable` | Table with built-in pagination, sort, and filter. Data is passed as props. |
| `SearchInput` | Input with debounced `search` emit. Accepts `debounce` ms prop. |
| `ConfirmDialog` | Modal with confirm/cancel pattern. Title, body, and button labels are props. |
| `EmptyState` | Illustration slot + title + description + CTA button. |
| `FormField` | Wraps any input with label, hint, and error message. Works with `v-model`. |

**Rule for Tier 2:** Props must allow overriding every opinionated default. Hardcoding MXN is acceptable as a default; not allowing it to be changed is not.

---

### Tier 3 — Domain-Specific

**Definition:** Contains business logic, domain models, or behavior specific to this SaaS project. References `AppConfig`, `AppTheme`, tenant identifiers, or business rules.

**Published to GitHub Packages:** Never

**Lives in:** `apps/admin-fe/app/components/` or `apps/template/components/`

**Examples:**

| Component | Description | Why Not Published |
|-----------|-------------|-------------------|
| `BusinessCard` | Renders a business profile with logo, name, category, WhatsApp link | References `AppConfig` type; business-domain logic |
| `ProductCard` | Renders a product with SaaS-specific pricing tiers | Domain data model embedded in template |
| `WhatsAppButton` | Opens WhatsApp with pre-filled message using tenant phone number | Business-logic in component (phone formatting, URL generation) |
| `AppStatusPanel` | Shows deployment status of a spawned template app | References job store and Cloud Run–specific state |
| `TenantSelector` | Dropdown populated from Firestore tenant collection | Firestore query + auth context embedded |
| `GenerationProgress` | SSE-driven UI for AI app generation flow | Tightly coupled to admin server API shape |

---

## 3. Package Structure

```
sass-factory/
└── packages/
    ├── tokens/              ← NEW: @sass-factory/tokens
    │   ├── src/
    │   │   ├── colors.css       ← CSS custom properties: --color-primary, etc.
    │   │   ├── typography.css   ← --font-size-sm, --line-height-base, etc.
    │   │   ├── spacing.css      ← --spacing-1 through --spacing-16
    │   │   ├── radii.css        ← --radius-sm, --radius-md, --radius-full
    │   │   ├── shadows.css      ← --shadow-sm, --shadow-md, --shadow-lg
    │   │   ├── index.css        ← @import all token files
    │   │   └── index.ts         ← JS exports for token values (used in Storybook, tests)
    │   └── package.json         ← name: "@sass-factory/tokens"
    │
    ├── ui/                  ← EXISTING: @sass-factory/ui
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── Button/
    │   │   │   │   ├── Button.vue
    │   │   │   │   ├── Button.test.ts
    │   │   │   │   └── Button.stories.ts
    │   │   │   ├── Input/
    │   │   │   │   ├── Input.vue
    │   │   │   │   ├── Input.test.ts
    │   │   │   │   └── Input.stories.ts
    │   │   │   └── ... (one directory per component)
    │   │   ├── composables/
    │   │   │   ├── useToast.ts
    │   │   │   └── useModal.ts
    │   │   └── index.ts         ← barrel export: all components + composables
    │   ├── .storybook/
    │   │   ├── main.ts
    │   │   └── preview.ts
    │   └── package.json         ← name: "@sass-factory/ui"
    │
    └── core/                ← EXISTING: @sass-factory/core
        ├── src/
        │   ├── types/           ← AppConfig, AppTheme, TOPIC_PRESETS
        │   └── utils/           ← Firestore collection constants
        └── package.json         ← name: "@sass-factory/core"
```

### Dependency Direction

```
apps/admin-fe          → @sass-factory/ui, @sass-factory/core, @sass-factory/tokens
apps/template       → @sass-factory/ui, @sass-factory/core, @sass-factory/tokens
packages/ui         → @sass-factory/tokens
packages/core       → (no internal dependencies)
packages/tokens     → (no internal dependencies)
```

**Rule:** Arrows only point downward. `packages/core` never imports from `packages/ui`. `packages/tokens` never imports from `packages/core` or `packages/ui`. Circular dependencies are a build error.

---

## 4. Development Workflow for a New Component

Every new component follows this exact sequence. Skipping steps produces unreviewed, untested, and potentially unpublishable components.

### Step 1 — Design in Tokens First

Before writing a single Vue component, check whether the design decision is expressed in `@sass-factory/tokens`. If the component needs a new color, spacing value, or radius, add it to the tokens package first.

```bash
# Add a token to packages/tokens/src/colors.css
--color-status-active: #16a34a;
--color-status-inactive: #6b7280;
--color-status-error: #dc2626;
```

### Step 2 — Write the Component in `packages/ui/src/components/`

One directory per component. Every component directory contains three files: the component itself, its tests, and its stories.

```
packages/ui/src/components/StatusBadge/
├── StatusBadge.vue
├── StatusBadge.test.ts
└── StatusBadge.stories.ts
```

**Component file structure:**

```vue
<!-- packages/ui/src/components/StatusBadge/StatusBadge.vue -->
<script setup lang="ts">
export type Status = 'active' | 'inactive' | 'pending' | 'error'

const props = defineProps<{
  status: Status
  label?: string
}>()

const colorMap: Record<Status, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
}
</script>

<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colorMap[status]]">
    {{ label ?? status }}
  </span>
</template>
```

### Step 3 — Write the Unit Test with Vue Test Utils

Tests are written before or alongside the component, not after.

```typescript
// packages/ui/src/components/StatusBadge/StatusBadge.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from './StatusBadge.vue'

describe('StatusBadge', () => {
  it('renders the status label when no label prop is provided', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'active' } })
    expect(wrapper.text()).toBe('active')
  })

  it('renders the custom label when provided', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'active', label: 'Live' } })
    expect(wrapper.text()).toBe('Live')
  })

  it('applies green classes for active status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'active' } })
    expect(wrapper.classes()).toContain('bg-green-100')
  })

  it('applies red classes for error status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'error' } })
    expect(wrapper.classes()).toContain('bg-red-100')
  })
})
```

Run tests from the workspace root:

```bash
pnpm --filter @sass-factory/ui test
```

### Step 4 — Write the Storybook Story

```typescript
// packages/ui/src/components/StatusBadge/StatusBadge.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import StatusBadge from './StatusBadge.vue'

const meta: Meta<typeof StatusBadge> = {
  title: 'Tier 2 / StatusBadge',
  component: StatusBadge,
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'inactive', 'pending', 'error'],
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusBadge>

export const Active: Story = { args: { status: 'active' } }
export const Inactive: Story = { args: { status: 'inactive' } }
export const Pending: Story = { args: { status: 'pending' } }
export const Error: Story = { args: { status: 'error', label: 'Failed' } }

export const AllStates: Story = {
  render: () => ({
    components: { StatusBadge },
    template: `
      <div class="flex gap-2 flex-wrap">
        <StatusBadge status="active" />
        <StatusBadge status="inactive" />
        <StatusBadge status="pending" />
        <StatusBadge status="error" />
      </div>
    `,
  }),
}
```

### Step 5 — Export from the Barrel

```typescript
// packages/ui/src/index.ts — add to existing exports
export { default as StatusBadge } from './components/StatusBadge/StatusBadge.vue'
export type { Status } from './components/StatusBadge/StatusBadge.vue'
```

### Step 6 — Consume Locally via `workspace:*`

In any app within the monorepo, the package is already available without publishing:

```json
// apps/admin-fe/package.json
{
  "dependencies": {
    "@sass-factory/ui": "workspace:*",
    "@sass-factory/tokens": "workspace:*"
  }
}
```

Usage in a Nuxt page or component:

```vue
<script setup lang="ts">
import { StatusBadge } from '@sass-factory/ui'
</script>

<template>
  <StatusBadge status="active" label="Live" />
</template>
```

### Step 7 — When Stable, Version and Publish

A component is "stable" when:
- It has been used in at least one sprint within the monorepo
- Its API has not changed across that sprint
- Tests pass, Storybook story exists, and it is exported from `index.ts`

At that point, use the Changesets workflow (Section 5) to version and publish.

---

## 5. Versioning with Changesets

[Changesets](https://github.com/changesets/changesets) manages versioning and changelogs for multi-package monorepos. It prevents accidental major version bumps, keeps changelogs accurate, and coordinates releases across packages.

### Setup

```bash
# Install at workspace root
pnpm add -D @changesets/cli -w

# Initialize (creates .changeset/ directory)
pnpm changeset init
```

### `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "develop",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Set `"access": "public"` if the packages should be publicly installable without an auth token.

### Release Workflow

```bash
# 1. After implementing a stable component or change
pnpm changeset

# CLI prompts:
# → Which packages are affected? (select @sass-factory/ui, @sass-factory/tokens)
# → What type of change? (patch | minor | major)
# → Describe the change (appears in CHANGELOG.md)

# 2. Commit the generated changeset file
git add .changeset/
git commit -m "chore: add changeset for StatusBadge component"

# 3. Before release (on release/* branch)
pnpm changeset version
# → Bumps versions in package.json
# → Updates CHANGELOG.md for each affected package
# → Removes consumed changeset files

# 4. Publish to GitHub Packages
pnpm changeset publish
# → Runs `pnpm publish` for each package with a version bump
# → Tags the release in git
```

### Semantic Version Guide

| Change Type | Version Bump | Examples |
|-------------|-------------|---------|
| Bug fix, internal refactor | `patch` (1.0.X) | Fix Badge color not applying |
| New component, new prop | `minor` (1.X.0) | Add StatusBadge component |
| Removed prop, renamed export, breaking change | `major` (X.0.0) | Rename `variant` to `color` on Button |

**Rule:** Never publish a `major` bump without documenting a migration path in the changeset description.

---

## 6. GitHub Packages Setup

### `.npmrc` at repository root

```ini
@sass-factory:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

The `NODE_AUTH_TOKEN` is a GitHub Personal Access Token with `write:packages` scope. It is stored as a GitHub Actions secret — never committed to the repository.

### `package.json` for each published package

```json
// packages/ui/package.json
{
  "name": "@sass-factory/ui",
  "version": "0.1.0",
  "description": "Shared UI component library for sass-factory projects",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "restricted"
  },
  "peerDependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "vue": "^3.4.0"
  }
}
```

```json
// packages/tokens/package.json
{
  "name": "@sass-factory/tokens",
  "version": "0.1.0",
  "description": "Design tokens for sass-factory projects",
  "main": "./src/index.css",
  "exports": {
    ".": "./src/index.css",
    "./tokens": "./src/index.ts"
  },
  "files": ["src"],
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "restricted"
  }
}
```

### GitHub Actions — Publish Workflow

```yaml
# .github/workflows/publish-packages.yml
name: Publish Packages

on:
  push:
    branches:
      - main
    paths:
      - 'packages/**'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://npm.pkg.github.com'
          scope: '@sass-factory'

      - run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build:packages

      - name: Publish to GitHub Packages
        run: pnpm changeset publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 7. Consuming in Another Project

For a new project by the same team to consume these packages:

### Step 1 — Configure `.npmrc` in the consuming project

```ini
@sass-factory:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

The developer needs a GitHub PAT with `read:packages` scope set as `NODE_AUTH_TOKEN` in their environment (e.g., `.env.local` or shell profile).

### Step 2 — Install packages

```bash
pnpm add @sass-factory/ui@latest
pnpm add @sass-factory/tokens@latest
```

### Step 3 — Import tokens in the app entry

```typescript
// nuxt.config.ts (for a Nuxt 4 consumer)
export default defineNuxtConfig({
  css: ['@sass-factory/tokens/src/index.css'],
})
```

### Step 4 — Use components

```vue
<script setup lang="ts">
import { Button, StatusBadge, PriceDisplay } from '@sass-factory/ui'
</script>

<template>
  <div>
    <StatusBadge status="active" />
    <PriceDisplay :value="1299" currency="MXN" />
    <Button variant="primary">Get Started</Button>
  </div>
</template>
```

### No Code Copying

Once a component is published to GitHub Packages, consuming projects install it as a versioned dependency. They do not copy `.vue` files. When the library releases a fix or a new component, consuming projects get the update with `pnpm update @sass-factory/ui`.

---

## 8. Storybook Setup for `packages/ui`

Storybook provides visual documentation, interaction testing, and a development environment for components in isolation — without running a full Nuxt app.

### Installation

```bash
# From the packages/ui directory
pnpm --filter @sass-factory/ui add -D \
  @storybook/vue3-vite \
  @storybook/vue3 \
  @storybook/addon-essentials \
  @storybook/addon-interactions \
  @storybook/test \
  storybook
```

### `.storybook/main.ts`

```typescript
// packages/ui/.storybook/main.ts
import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
}

export default config
```

### `.storybook/preview.ts`

```typescript
// packages/ui/.storybook/preview.ts
import type { Preview } from '@storybook/vue3'
import '@sass-factory/tokens/src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
}

export default preview
```

### `package.json` scripts

```json
{
  "scripts": {
    "storybook": "storybook dev --port 6006",
    "build:storybook": "storybook build",
    "test": "vitest",
    "build": "vite build"
  }
}
```

### Running Storybook

```bash
# From workspace root
pnpm --filter @sass-factory/ui storybook

# Or from packages/ui directory
pnpm storybook
```

Storybook runs at `http://localhost:6006`. Each story file maps to a component. Stories are the visual contract: if a component doesn't look right in Storybook, it doesn't ship.

### Storybook as a Tier Gate

Before a component is promoted from "in development" to "stable" (eligible for Changesets versioning and publishing), it must have:

- [ ] At least one story per significant visual variant
- [ ] An `AllStates` or `All Variants` story that renders every prop combination
- [ ] Controls configured so reviewers can interact with props
- [ ] No console errors when stories are rendered

---

## 9. Rule — Never Publish Tier 3 Components

### The Rule

Tier 3 components are never added to `packages/ui`. They live exclusively in `apps/admin-fe/app/components/` or `apps/template/components/`.

### Why Domain Logic Does Not Belong in a Generic Library

**Coupling.** A `WhatsAppButton` that hardcodes the message format for a Mexican SaaS business is not a button — it is a business rule expressed as a component. Publishing it means every consumer of `@sass-factory/ui` inherits that business rule, whether they want it or not.

**Versioning contamination.** When a Tier 3 component changes because the business changes (a new phone format, a new product category, a new API shape), that triggers a version bump in `@sass-factory/ui`. Consumers who have nothing to do with that business are forced to evaluate an upgrade that has no relevance to them.

**Leaking data models.** Tier 3 components reference `AppConfig`, `AppTheme`, Firestore collection shapes, and tenant identifiers. These are domain types that only make sense in the context of this SaaS project. Publishing them to a generic library leaks the internal data model into the public API surface of a shared package.

**Maintenance burden.** A generic library must maintain backward compatibility across consumers. Tier 3 components evolve with the product — they change frequently, break their own APIs, and are refactored without concern for external consumers. Mixing that instability into a stable shared library destroys the value of having a shared library.

**The test:** If the component cannot be fully documented in Storybook without importing a domain type or making a Firestore call, it does not belong in `packages/ui`.

### Correct Decomposition

The correct approach when a Tier 3 component needs something reusable is to extract that reusable part into a Tier 1 or Tier 2 component, then compose it in the app layer.

```
Tier 3: BusinessCard (apps/admin-fe)
    ├── uses Tier 2: ImageUpload (packages/ui)
    ├── uses Tier 1: Card, Badge, Button (packages/ui)
    └── owns: BusinessCard-specific layout, AppConfig reference
```

The library provides the building blocks. The app composes them with domain knowledge.

---

## 10. Sprint Integration

### Sprint 2 — Design System Foundation

This work is the primary deliverable of Sprint 2. Nothing from the component library is consumed in production features during Sprint 2 — it is built, tested, and documented so that Sprint 3 and beyond can consume it without friction.

| Sprint 2 Deliverable | Package | Status |
|----------------------|---------|--------|
| Design tokens (colors, typography, spacing, radii, shadows) | `@sass-factory/tokens` | New |
| Storybook configured and running | `packages/ui` | New |
| Button (all variants and sizes) | `@sass-factory/ui` | New |
| Input, Textarea, FormField | `@sass-factory/ui` | New |
| Modal, ConfirmDialog | `@sass-factory/ui` | New |
| Card, Badge, StatusBadge | `@sass-factory/ui` | New |
| Toast + useToast composable | `@sass-factory/ui` | New |
| Skeleton, Spinner | `@sass-factory/ui` | New |
| Table, DataTable | `@sass-factory/ui` | New |
| Tabs | `@sass-factory/ui` | New |
| PriceDisplay (MXN default) | `@sass-factory/ui` | New |
| ImageUpload with validation | `@sass-factory/ui` | New |
| Changeset config + GitHub Packages publish workflow | root | New |
| First published version: `@sass-factory/ui@0.1.0` | GitHub Packages | Sprint 2 end |

### Sprint 3+ — Consumption

Starting in Sprint 3, feature teams import from `@sass-factory/ui` via `workspace:*`. If a new reusable component is needed during Sprint 3, the same workflow applies: write it in `packages/ui`, test it, add a story, export it, then use it.

New components identified during Sprint 3 that meet the Tier 1 or Tier 2 criteria are added to the library and published with the next Changesets release. Components that are Tier 3 stay in the app.

### Velocity Impact

The upfront investment in Sprint 2 is real. A Design System sprint does not ship user-facing features. The return:

- Sprint 3 UI work is 40-60% faster because every component already exists
- No duplicate implementation of Modal, Toast, or Button across multiple pages
- Bugs in shared components are fixed once and automatically propagate
- Future projects start at Sprint 3 velocity, not Sprint 0

---

## Appendix: Component Status Tracker

Maintain this table in sprint planning to track which components have cleared each gate.

| Component | Tier | `.vue` | Unit Test | Story | Exported | Published |
|-----------|------|--------|-----------|-------|----------|-----------|
| Button | 1 | — | — | — | — | — |
| Input | 1 | — | — | — | — | — |
| Textarea | 1 | — | — | — | — | — |
| Modal | 1 | — | — | — | — | — |
| Card | 1 | — | — | — | — | — |
| Badge | 1 | — | — | — | — | — |
| Toast | 1 | — | — | — | — | — |
| Skeleton | 1 | — | — | — | — | — |
| Spinner | 1 | — | — | — | — | — |
| Table | 1 | — | — | — | — | — |
| Tabs | 1 | — | — | — | — | — |
| Avatar | 1 | — | — | — | — | — |
| Tooltip | 1 | — | — | — | — | — |
| Dropdown | 1 | — | — | — | — | — |
| StatusBadge | 2 | — | — | — | — | — |
| PriceDisplay | 2 | — | — | — | — | — |
| ImageUpload | 2 | — | — | — | — | — |
| DataTable | 2 | — | — | — | — | — |
| SearchInput | 2 | — | — | — | — | — |
| ConfirmDialog | 2 | — | — | — | — | — |
| EmptyState | 2 | — | — | — | — | — |
| FormField | 2 | — | — | — | — | — |
