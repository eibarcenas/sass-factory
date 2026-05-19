# Sprint 2 — Design System + Component Library

**Branch:** `sprint/2-design-system` from `develop`
**Duration:** 1 week
**Agents:** `tokens-agent` + `components-agent` (parallel after tokens package is published locally)
**Initiatives covered:** Platform Core (E2)
**Pre-condition:** Sprint 1 MR merged to `develop`

---

## Objective

Build a design token package and a full reusable component library that:

- Is **typed**, **tested**, **documented in Storybook**, and **publishable** to GitHub Packages.
- Separates generic (Tier 1 & 2) from domain-specific (Tier 3) components explicitly.
- Gives every subsequent sprint a consistent visual language and a single source of truth for UI primitives.
- Follows TDD: failing tests are written for each component before the component is implemented.

---

## Package Architecture

| Package | Name | npm scope | Who publishes |
|---------|------|-----------|---------------|
| `packages/tokens` | `@sass-factory/tokens` | Public (GitHub Packages) | `tokens-agent` |
| `packages/ui` | `@sass-factory/ui` | Public (GitHub Packages) | `components-agent` |

`apps/admin` and `apps/storefront` (Sprint 3) install these as workspace dependencies. Domain-specific Tier 3 components live **inside the consuming app**, never in a published package.

---

## Agent Assignment

```
Day 1–2: tokens-agent (solo)
  - Create packages/tokens structure
  - Define all CSS custom properties
  - Export typed JS constants
  - Write Storybook preview config consuming tokens
  - Publish dry-run: pnpm pack
  - COMMIT: "feat(tokens): design token package with full CSS variables"

Day 2–5: components-agent (starts after tokens commit is available)
  - Add @sass-factory/tokens as dependency to packages/ui
  - Configure Storybook in packages/ui
  - For each component (Tier 1 → Tier 2 order):
      a. Write failing Vitest test
      b. Implement component
      c. Make test pass (green)
      d. Refactor if needed
      e. Write Storybook story
  - Add Changesets
  - COMMIT: "feat(ui): full component library with Storybook and tests"
```

---

## Design Tokens Package

### Directory structure: `packages/tokens/`

```
packages/tokens/
├── src/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── borders.ts
│   ├── shadows.ts
│   ├── breakpoints.ts
│   ├── z-index.ts
│   ├── index.ts          ← barrel export
│   └── css-vars.ts       ← generates :root { --sf-* } string
├── dist/
│   ├── tokens.css         ← generated :root block
│   └── index.js / index.d.ts
├── package.json
└── build.ts              ← script to generate tokens.css from source
```

### `packages/tokens/src/colors.ts`

```typescript
export const colors = {
  // Brand primaries
  primary: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',   // Main brand green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // Neutral grays
  neutral: {
    50:  '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
  // Semantic status colors (for StatusBadge)
  status: {
    draft:     { bg: '#f4f4f5', text: '#3f3f46', border: '#d4d4d8' },
    demo:      { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    sent:      { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
    accepted:  { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    active:    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
    suspended: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
    expired:   { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
  },
  // Alert / feedback
  success: { 50: '#f0fdf4', 500: '#22c55e', 700: '#15803d' },
  warning: { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
  error:   { 50: '#fef2f2', 500: '#ef4444', 700: '#b91c1c' },
  info:    { 50: '#eff6ff', 500: '#3b82f6', 700: '#1d4ed8' },
} as const

export type ColorToken = typeof colors
```

### `packages/tokens/src/typography.ts`

```typescript
export const typography = {
  fonts: {
    sans:  '"Inter", "Segoe UI", system-ui, sans-serif',
    serif: '"Playfair Display", Georgia, serif',
    mono:  '"JetBrains Mono", "Fira Code", monospace',
  },
  sizes: {
    xs:   '0.75rem',    // 12px
    sm:   '0.875rem',   // 14px
    base: '1rem',       // 16px
    lg:   '1.125rem',   // 18px
    xl:   '1.25rem',    // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  weights: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    black:    '900',
  },
  lineHeights: {
    tight:   '1.25',
    snug:    '1.375',
    normal:  '1.5',
    relaxed: '1.625',
    loose:   '2',
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight:   '-0.025em',
    normal:  '0em',
    wide:    '0.025em',
    wider:   '0.05em',
    widest:  '0.1em',
  },
} as const
```

### `packages/tokens/src/spacing.ts`

```typescript
// 4px base unit — all values are multiples of 4
export const spacing = {
  0:    '0px',
  px:   '1px',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  2.5:  '10px',
  3:    '12px',
  3.5:  '14px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  7:    '28px',
  8:    '32px',
  9:    '36px',
  10:   '40px',
  11:   '44px',
  12:   '48px',
  14:   '56px',
  16:   '64px',
  20:   '80px',
  24:   '96px',
  28:   '112px',
  32:   '128px',
  36:   '144px',
  40:   '160px',
  44:   '176px',
  48:   '192px',
  52:   '208px',
  56:   '224px',
  60:   '240px',
  64:   '256px',
  72:   '288px',
  80:   '320px',
  96:   '384px',
} as const
```

### `packages/tokens/src/borders.ts`

```typescript
export const borderRadius = {
  none:  '0px',
  sm:    '2px',
  base:  '4px',
  md:    '6px',
  lg:    '8px',
  xl:    '12px',
  '2xl': '16px',
  '3xl': '24px',
  full:  '9999px',
} as const

export const borderWidth = {
  0:    '0px',
  base: '1px',
  2:    '2px',
  4:    '4px',
  8:    '8px',
} as const
```

### `packages/tokens/src/shadows.ts`

```typescript
export const shadows = {
  sm:   '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md:   '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg:   '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl:   '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none:  '0 0 #0000',
} as const
```

### `packages/tokens/src/breakpoints.ts`

```typescript
export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1536px',
} as const
```

### `packages/tokens/src/z-index.ts`

```typescript
export const zIndex = {
  hide:     -1,
  auto:     'auto',
  base:     0,
  raised:   1,
  dropdown: 1000,
  sticky:   1100,
  banner:   1200,
  overlay:  1300,
  modal:    1400,
  popover:  1500,
  toast:    1600,
  tooltip:  1700,
} as const
```

### `packages/tokens/src/css-vars.ts`

```typescript
import { colors } from './colors'
import { typography } from './typography'
import { spacing } from './spacing'
import { borderRadius } from './borders'
import { shadows } from './shadows'
import { zIndex } from './z-index'

/**
 * Generates the :root { --sf-* } CSS block from token values.
 * Import tokens.css in your app entry point:
 *   import '@sass-factory/tokens/dist/tokens.css'
 */
export function generateCssVars(): string {
  const lines: string[] = [':root {']

  // Colors — primary
  Object.entries(colors.primary).forEach(([shade, value]) => {
    lines.push(`  --sf-color-primary-${shade}: ${value};`)
  })

  // Colors — neutral
  Object.entries(colors.neutral).forEach(([shade, value]) => {
    lines.push(`  --sf-color-neutral-${shade}: ${value};`)
  })

  // Colors — semantic status
  Object.entries(colors.status).forEach(([status, { bg, text, border }]) => {
    lines.push(`  --sf-status-${status}-bg: ${bg};`)
    lines.push(`  --sf-status-${status}-text: ${text};`)
    lines.push(`  --sf-status-${status}-border: ${border};`)
  })

  // Typography sizes
  Object.entries(typography.sizes).forEach(([key, value]) => {
    lines.push(`  --sf-text-${key}: ${value};`)
  })

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    const cssKey = String(key).replace('.', '_')
    lines.push(`  --sf-space-${cssKey}: ${value};`)
  })

  // Border radius
  Object.entries(borderRadius).forEach(([key, value]) => {
    lines.push(`  --sf-radius-${key}: ${value};`)
  })

  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    lines.push(`  --sf-shadow-${key}: ${value};`)
  })

  // Z-index
  Object.entries(zIndex).forEach(([key, value]) => {
    lines.push(`  --sf-z-${key}: ${value};`)
  })

  lines.push('}')
  return lines.join('\n')
}
```

### `packages/tokens/package.json`

```json
{
  "name": "@sass-factory/tokens",
  "version": "0.1.0",
  "description": "Design tokens for the sass-factory platform",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./dist/tokens.css": "./dist/tokens.css"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts && node -e \"const {generateCssVars} = require('./dist/index.js'); require('fs').writeFileSync('./dist/tokens.css', generateCssVars())\"",
    "dev": "tsup src/index.ts --format esm --dts --watch"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "public"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0"
  }
}
```

---

## Component Library — `packages/ui`

### Storybook setup additions to `packages/ui/package.json`:

```json
{
  "devDependencies": {
    "@storybook/vue3-vite": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-a11y": "^8.0.0",
    "@sass-factory/tokens": "workspace:*"
  },
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

`.storybook/main.ts`:
```typescript
import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: { name: '@storybook/vue3-vite', options: {} },
}

export default config
```

`.storybook/preview.ts`:
```typescript
import '@sass-factory/tokens/dist/tokens.css'
import type { Preview } from '@storybook/vue3'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#fafafa' },
        { name: 'dark',  value: '#18181b' },
      ],
    },
  },
}

export default preview
```

---

## Tier 1 Components — Generic, Publishable

### 1. Button

**Props interface:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}
```

**Emits:**
```typescript
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
```

**Vitest test — `src/components/__tests__/Button.test.ts`:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../Button.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Guardar' } })
    expect(wrapper.text()).toBe('Guardar')
  })

  it('applies primary variant class by default', () => {
    const wrapper = mount(Button)
    expect(wrapper.classes()).toContain('btn-primary')
  })

  it('applies danger variant class when variant="danger"', () => {
    const wrapper = mount(Button, { props: { variant: 'danger' } })
    expect(wrapper.classes()).toContain('btn-danger')
  })

  it('applies sm size class when size="sm"', () => {
    const wrapper = mount(Button, { props: { size: 'sm' } })
    expect(wrapper.classes()).toContain('btn-sm')
  })

  it('emits click event when clicked and not disabled', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does NOT emit click event when disabled', async () => {
    const wrapper = mount(Button, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('does NOT emit click event when loading', async () => {
    const wrapper = mount(Button, { props: { loading: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('shows spinner when loading=true', () => {
    const wrapper = mount(Button, { props: { loading: true } })
    expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(true)
  })

  it('has correct type attribute', () => {
    const wrapper = mount(Button, { props: { type: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('applies full-width class when fullWidth=true', () => {
    const wrapper = mount(Button, { props: { fullWidth: true } })
    expect(wrapper.classes()).toContain('w-full')
  })
})
```

**Storybook story — `src/components/Button.stories.ts`:**
```typescript
import type { Meta, StoryObj } from '@storybook/vue3'
import Button from './Button.vue'

const meta: Meta<typeof Button> = {
  title: 'Tier 1/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size:    { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    loading:  { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { variant: 'primary' },
  render: (args) => ({ components: { Button }, setup: () => ({ args }), template: '<Button v-bind="args">Guardar</Button>' }),
}

export const Danger: Story = {
  args: { variant: 'danger' },
  render: (args) => ({ components: { Button }, setup: () => ({ args }), template: '<Button v-bind="args">Eliminar</Button>' }),
}

export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({ components: { Button }, setup: () => ({ args }), template: '<Button v-bind="args">Procesando</Button>' }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex gap-4 flex-wrap">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
    `,
  }),
}
```

---

### 2. Input

**Props interface:**
```typescript
interface InputProps {
  modelValue?: string | number
  type?: 'text' | 'number' | 'tel' | 'email' | 'password'
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  id?: string
}
```

**Emits:**
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()
```

**Vitest tests:**
```typescript
describe('Input', () => {
  it('renders label when label prop is provided', () => {
    const wrapper = mount(Input, { props: { label: 'Nombre del negocio' } })
    expect(wrapper.find('label').text()).toBe('Nombre del negocio')
  })

  it('renders error message when error prop is provided', () => {
    const wrapper = mount(Input, { props: { error: 'Campo requerido' } })
    expect(wrapper.find('[data-testid="input-error"]').text()).toBe('Campo requerido')
  })

  it('renders hint text when hint prop is provided and no error', () => {
    const wrapper = mount(Input, { props: { hint: 'Máximo 50 caracteres' } })
    expect(wrapper.find('[data-testid="input-hint"]').text()).toBe('Máximo 50 caracteres')
  })

  it('does not render hint when error is present', () => {
    const wrapper = mount(Input, { props: { hint: 'Ayuda', error: 'Error' } })
    expect(wrapper.find('[data-testid="input-hint"]').exists()).toBe(false)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(Input, { props: { modelValue: '' } })
    const input = wrapper.find('input')
    await input.setValue('Heladería')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Heladería'])
  })

  it('applies error styles when error is present', () => {
    const wrapper = mount(Input, { props: { error: 'Error' } })
    expect(wrapper.find('input').classes()).toContain('input-error')
  })

  it('is disabled when disabled=true', () => {
    const wrapper = mount(Input, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('label htmlFor matches input id', () => {
    const wrapper = mount(Input, { props: { id: 'business-name', label: 'Nombre' } })
    expect(wrapper.find('label').attributes('for')).toBe('business-name')
    expect(wrapper.find('input').attributes('id')).toBe('business-name')
  })
})
```

---

### 3. Card

**Props interface:**
```typescript
interface CardProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'xl'
}
```

**Slots:** `header`, `default` (body), `footer`

**Vitest tests:**
```typescript
describe('Card', () => {
  it('renders default slot content', () => {
    const wrapper = mount(Card, { slots: { default: '<p>Contenido</p>' } })
    expect(wrapper.find('p').text()).toBe('Contenido')
  })

  it('renders header slot when provided', () => {
    const wrapper = mount(Card, { slots: { header: '<h3>Título</h3>' } })
    expect(wrapper.find('[data-testid="card-header"]').exists()).toBe(true)
  })

  it('does not render header section when header slot is empty', () => {
    const wrapper = mount(Card)
    expect(wrapper.find('[data-testid="card-header"]').exists()).toBe(false)
  })

  it('renders footer slot when provided', () => {
    const wrapper = mount(Card, { slots: { footer: '<button>Guardar</button>' } })
    expect(wrapper.find('[data-testid="card-footer"]').exists()).toBe(true)
  })

  it('applies padding class based on padding prop', () => {
    const wrapper = mount(Card, { props: { padding: 'lg' } })
    expect(wrapper.classes()).toContain('card-padding-lg')
  })
})
```

---

### 4. Badge

**Props interface:**
```typescript
interface BadgeProps {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md'
  dot?: boolean       // show a colored dot before text
}
```

**Vitest tests:**
```typescript
describe('Badge', () => {
  it('renders slot content', () => {
    const wrapper = mount(Badge, { slots: { default: 'Nuevo' } })
    expect(wrapper.text()).toContain('Nuevo')
  })

  it('applies info variant class by default', () => {
    const wrapper = mount(Badge)
    expect(wrapper.classes()).toContain('badge-info')
  })

  it('applies correct variant class for each variant', () => {
    const variants = ['info', 'success', 'warning', 'error', 'neutral'] as const
    variants.forEach((v) => {
      const w = mount(Badge, { props: { variant: v } })
      expect(w.classes()).toContain(`badge-${v}`)
    })
  })

  it('shows dot element when dot=true', () => {
    const wrapper = mount(Badge, { props: { dot: true } })
    expect(wrapper.find('[data-testid="badge-dot"]').exists()).toBe(true)
  })
})
```

---

### 5. Modal

**Props interface:**
```typescript
interface ModalProps {
  modelValue: boolean    // open/close (v-model)
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlay?: boolean
  showClose?: boolean
}
```

**Emits:**
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()
```

**Slots:** `default` (body), `footer`

**Vitest tests:**
```typescript
describe('Modal', () => {
  it('renders when modelValue=true', () => {
    const wrapper = mount(Modal, { props: { modelValue: true } })
    expect(wrapper.find('[data-testid="modal-overlay"]').exists()).toBe(true)
  })

  it('does not render when modelValue=false', () => {
    const wrapper = mount(Modal, { props: { modelValue: false } })
    expect(wrapper.find('[data-testid="modal-overlay"]').exists()).toBe(false)
  })

  it('emits close and update:modelValue when close button is clicked', async () => {
    const wrapper = mount(Modal, { props: { modelValue: true, showClose: true } })
    await wrapper.find('[data-testid="modal-close"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('emits close when overlay is clicked and closeOnOverlay=true', async () => {
    const wrapper = mount(Modal, { props: { modelValue: true, closeOnOverlay: true } })
    await wrapper.find('[data-testid="modal-overlay"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does NOT emit close when overlay clicked and closeOnOverlay=false', async () => {
    const wrapper = mount(Modal, { props: { modelValue: true, closeOnOverlay: false } })
    await wrapper.find('[data-testid="modal-overlay"]').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('renders title when title prop is provided', () => {
    const wrapper = mount(Modal, { props: { modelValue: true, title: 'Confirmar' } })
    expect(wrapper.text()).toContain('Confirmar')
  })
})
```

---

### 6. Toast

**Props interface:**
```typescript
interface ToastProps {
  variant?: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number     // ms, 0 = no auto-dismiss
  dismissible?: boolean
}
```

**Emits:**
```typescript
const emit = defineEmits<{
  dismiss: []
}>()
```

**Vitest tests:**
```typescript
describe('Toast', () => {
  it('renders the message', () => {
    const wrapper = mount(Toast, { props: { message: 'Guardado correctamente', variant: 'success' } })
    expect(wrapper.text()).toContain('Guardado correctamente')
  })

  it('applies success variant class', () => {
    const wrapper = mount(Toast, { props: { message: 'OK', variant: 'success' } })
    expect(wrapper.classes()).toContain('toast-success')
  })

  it('emits dismiss when dismiss button is clicked', async () => {
    const wrapper = mount(Toast, { props: { message: 'OK', variant: 'info', dismissible: true } })
    await wrapper.find('[data-testid="toast-dismiss"]').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('auto-dismisses after duration ms', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Toast, { props: { message: 'OK', variant: 'info', duration: 3000 } })
    vi.advanceTimersByTime(3001)
    await nextTick()
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    vi.useRealTimers()
  })
})
```

---

### 7. Skeleton

**Props interface:**
```typescript
interface SkeletonProps {
  variant?: 'text' | 'card' | 'image' | 'circle'
  width?: string     // CSS value, e.g. "100%", "200px"
  height?: string    // CSS value
  lines?: number     // For text variant: number of lines
  animate?: boolean  // pulse animation (default: true)
}
```

**Vitest tests:**
```typescript
describe('Skeleton', () => {
  it('renders text variant with 3 lines by default', () => {
    const wrapper = mount(Skeleton, { props: { variant: 'text', lines: 3 } })
    expect(wrapper.findAll('[data-testid="skeleton-line"]')).toHaveLength(3)
  })

  it('applies animate class by default', () => {
    const wrapper = mount(Skeleton)
    expect(wrapper.classes()).toContain('animate-pulse')
  })

  it('does not apply animate class when animate=false', () => {
    const wrapper = mount(Skeleton, { props: { animate: false } })
    expect(wrapper.classes()).not.toContain('animate-pulse')
  })
})
```

---

### 8. Table

**Props interface:**
```typescript
interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[]
  rows: T[]
  loading?: boolean
  emptyMessage?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}
```

**Emits:**
```typescript
const emit = defineEmits<{
  sort: [column: string, direction: 'asc' | 'desc']
  rowClick: [row: unknown]
}>()
```

**Vitest tests:**
```typescript
describe('Table', () => {
  const columns = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'status', label: 'Estado' },
  ]
  const rows = [
    { name: 'Heladería El Pingüino', status: 'active' },
    { name: 'Taquería Los Compadres', status: 'demo' },
  ]

  it('renders column headers', () => {
    const wrapper = mount(Table, { props: { columns, rows } })
    expect(wrapper.text()).toContain('Nombre')
    expect(wrapper.text()).toContain('Estado')
  })

  it('renders correct number of rows', () => {
    const wrapper = mount(Table, { props: { columns, rows } })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('emits sort event when sortable column header is clicked', async () => {
    const wrapper = mount(Table, { props: { columns, rows } })
    await wrapper.find('th[data-sortable]').trigger('click')
    expect(wrapper.emitted('sort')).toHaveLength(1)
  })

  it('shows empty state when rows is empty', () => {
    const wrapper = mount(Table, { props: { columns, rows: [], emptyMessage: 'Sin resultados' } })
    expect(wrapper.text()).toContain('Sin resultados')
  })

  it('shows skeleton rows when loading=true', () => {
    const wrapper = mount(Table, { props: { columns, rows: [], loading: true } })
    expect(wrapper.find('[data-testid="table-skeleton"]').exists()).toBe(true)
  })
})
```

---

## Tier 2 Components — Opinionated, Publishable

### StatusBadge

**Props interface:**
```typescript
import type { BusinessStatus } from '@sass-factory/core'

interface StatusBadgeProps {
  status: BusinessStatus
  size?: 'sm' | 'md'
  showDot?: boolean
}
```

**Status → display mapping:**
```typescript
const STATUS_DISPLAY: Record<BusinessStatus, { label: string; cssClass: string }> = {
  draft:     { label: 'Borrador',   cssClass: 'status-badge-draft' },
  demo:      { label: 'Demo',       cssClass: 'status-badge-demo' },
  sent:      { label: 'Enviado',    cssClass: 'status-badge-sent' },
  accepted:  { label: 'Aceptado',   cssClass: 'status-badge-accepted' },
  expired:   { label: 'Expirado',   cssClass: 'status-badge-expired' },
  active:    { label: 'Activo',     cssClass: 'status-badge-active' },
  suspended: { label: 'Suspendido', cssClass: 'status-badge-suspended' },
}
```

**Vitest tests:**
```typescript
describe('StatusBadge', () => {
  it('renders "Borrador" label for draft status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'draft' } })
    expect(wrapper.text()).toBe('Borrador')
  })

  it('renders "Demo" label for demo status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'demo' } })
    expect(wrapper.text()).toBe('Demo')
  })

  it('renders "Activo" label for active status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'active' } })
    expect(wrapper.text()).toBe('Activo')
  })

  it('renders "Suspendido" label for suspended status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'suspended' } })
    expect(wrapper.text()).toBe('Suspendido')
  })

  it('applies correct CSS class for draft → gray', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'draft' } })
    expect(wrapper.classes()).toContain('status-badge-draft')
  })

  it('applies correct CSS class for demo → blue', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'demo' } })
    expect(wrapper.classes()).toContain('status-badge-demo')
  })

  it('applies correct CSS class for active → emerald', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'active' } })
    expect(wrapper.classes()).toContain('status-badge-active')
  })

  it('applies correct CSS class for suspended → red', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'suspended' } })
    expect(wrapper.classes()).toContain('status-badge-suspended')
  })
})
```

---

### PriceDisplay

**Props interface:**
```typescript
interface PriceDisplayProps {
  price: number               // Current price in MXN
  originalPrice?: number      // Optional crossed-out original (for discounts)
  currency?: string           // Default: 'MXN'
  size?: 'sm' | 'md' | 'lg'
  showCurrency?: boolean      // Default: true — shows "MXN" label
}
```

**Vitest tests:**
```typescript
describe('PriceDisplay', () => {
  it('formats price as MXN currency', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 89.5 } })
    expect(wrapper.text()).toContain('$89.50')
  })

  it('shows crossed-out original price when provided', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 70, originalPrice: 100 } })
    expect(wrapper.find('[data-testid="original-price"]').classes()).toContain('line-through')
    expect(wrapper.text()).toContain('$100.00')
  })

  it('does not show original price element when originalPrice is undefined', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 70 } })
    expect(wrapper.find('[data-testid="original-price"]').exists()).toBe(false)
  })

  it('shows "MXN" label by default', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 50 } })
    expect(wrapper.text()).toContain('MXN')
  })

  it('hides currency label when showCurrency=false', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 50, showCurrency: false } })
    expect(wrapper.text()).not.toContain('MXN')
  })
})
```

---

### ImageUpload

**Props interface:**
```typescript
interface ImageUploadProps {
  modelValue?: File | null
  accept?: string[]           // Default: ['image/jpeg', 'image/png', 'image/webp']
  maxSizeMb?: number          // Default: 2
  preview?: string            // Existing image URL to show before user uploads
  label?: string
  error?: string
}
```

**Emits:**
```typescript
const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  error: [message: string]
}>()
```

**Vitest tests:**
```typescript
describe('ImageUpload', () => {
  it('renders drag-drop zone', () => {
    const wrapper = mount(ImageUpload)
    expect(wrapper.find('[data-testid="drop-zone"]').exists()).toBe(true)
  })

  it('shows preview when preview URL is provided', () => {
    const wrapper = mount(ImageUpload, { props: { preview: 'https://example.com/img.jpg' } })
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/img.jpg')
  })

  it('emits error when file exceeds maxSizeMb', async () => {
    const wrapper = mount(ImageUpload, { props: { maxSizeMb: 2 } })
    const bigFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    // Simulate file selection
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [bigFile] })
    await input.trigger('change')
    expect(wrapper.emitted('error')?.[0]).toEqual(['El archivo supera el límite de 2 MB'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits error when SVG file is selected (XSS risk)', async () => {
    const wrapper = mount(ImageUpload)
    const svgFile = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [svgFile] })
    await input.trigger('change')
    expect(wrapper.emitted('error')?.[0]).toEqual(['Tipo de archivo no permitido. Usa JPG, PNG o WebP.'])
  })

  it('emits update:modelValue with valid JPEG file under 2MB', async () => {
    const wrapper = mount(ImageUpload, { props: { maxSizeMb: 2 } })
    const validFile = new File([new ArrayBuffer(500 * 1024)], 'logo.jpg', { type: 'image/jpeg' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [validFile] })
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([validFile])
    expect(wrapper.emitted('error')).toBeUndefined()
  })
})
```

---

## Tier 3 Components — Domain-Specific (NOT published, live in apps/)

These components import from `@sass-factory/ui` and `@sass-factory/core`. They are defined here for Sprint 3 and 4 to implement. **Do not add them to packages/ui.**

| Component | App | Description |
|-----------|-----|-------------|
| `BusinessCard` | `apps/admin` | Shows business name, type, status badge, action buttons |
| `ProductCard` | `apps/storefront` | Image, name, price display, "Pedir" button |
| `WhatsAppButton` | `apps/storefront` | Renders `<a href="https://wa.me/...">` with brand green styling |

---

## Gherkin Specifications

```gherkin
Feature: Button component behavior
  As a user interacting with the admin panel
  I want buttons to behave predictably
  So that I can trust the UI controls

  Scenario: Primary button renders with correct styles
    Given a Button component with variant="primary"
    When it renders
    Then it has the CSS class "btn-primary"
    And the background uses the primary color token

  Scenario: Disabled button does not emit click event
    Given a Button component with disabled=true
    When the user clicks the button
    Then no "click" event is emitted
    And the button element has the disabled attribute

  Scenario: Loading state shows spinner and prevents click
    Given a Button component with loading=true
    When it renders
    Then a spinner element with data-testid="spinner" is visible
    When the user clicks the button
    Then no "click" event is emitted

Feature: StatusBadge renders correct color per business status
  As an admin viewing the business list
  I want each business status to have a distinct color badge
  So that I can scan the list quickly without reading each label

  Scenario: draft status shows gray badge
    Given a StatusBadge component with status="draft"
    When it renders
    Then the badge text is "Borrador"
    And the badge has CSS class "status-badge-draft"
    And the background color comes from --sf-status-draft-bg (gray)

  Scenario: demo status shows blue badge
    Given a StatusBadge component with status="demo"
    When it renders
    Then the badge text is "Demo"
    And the badge has CSS class "status-badge-demo"
    And the background color comes from --sf-status-demo-bg (blue)

  Scenario: active status shows emerald badge
    Given a StatusBadge component with status="active"
    When it renders
    Then the badge text is "Activo"
    And the badge has CSS class "status-badge-active"
    And the background color comes from --sf-status-active-bg (emerald)

  Scenario: suspended status shows red badge
    Given a StatusBadge component with status="suspended"
    When it renders
    Then the badge text is "Suspendido"
    And the badge has CSS class "status-badge-suspended"
    And the background color comes from --sf-status-suspended-bg (red)

Feature: ImageUpload validates file before emitting
  As an admin uploading a business logo
  I want clear validation errors for invalid files
  So that I never accidentally upload an unsafe or oversized image

  Scenario: Valid JPEG under 2MB is accepted
    Given an ImageUpload component with maxSizeMb=2
    When the user selects a JPEG file of 500KB
    Then "update:modelValue" is emitted with the File object
    And no "error" event is emitted

  Scenario: File over 2MB is rejected with error message
    Given an ImageUpload component with maxSizeMb=2
    When the user selects a JPEG file of 3MB
    Then "update:modelValue" is NOT emitted
    And "error" is emitted with message "El archivo supera el límite de 2 MB"

  Scenario: SVG file is rejected (XSS risk)
    Given an ImageUpload component with default accept types
    When the user selects an SVG file
    Then "update:modelValue" is NOT emitted
    And "error" is emitted with message "Tipo de archivo no permitido. Usa JPG, PNG o WebP."

  Scenario: WebP file is accepted
    Given an ImageUpload component
    When the user selects a WebP file of 800KB
    Then "update:modelValue" is emitted with the File object
```

---

## Changesets Configuration

Install: `pnpm add -D @changesets/cli -w`

Initialize: `pnpm changeset init`

`.changeset/config.json`:
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [["@sass-factory/tokens", "@sass-factory/ui"]],
  "access": "public",
  "baseBranch": "develop",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

`.github/workflows/release.yml` (packages only):
```yaml
name: Release Packages

on:
  push:
    branches: [main]

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://npm.pkg.github.com'
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

`.npmrc` (root):
```
@sass-factory:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

---

## GitHub Packages `publishConfig` (in each publishable package.json)

```json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "public"
  }
}
```

---

## MR Template

**Title:** `feat(sprint-2): design tokens package + full component library with Storybook`

**Description:**

```
## What this MR does

Sprint 2 deliverable: the visual foundation for all app UIs.

### packages/tokens (@sass-factory/tokens — new package)
- Full CSS custom property system: colors (primary, neutral, semantic status), typography scale, spacing (4px base), border radius, shadows, breakpoints, z-index
- generateCssVars() generates :root block at build time
- Publishable to GitHub Packages

### packages/ui (@sass-factory/ui — extended)
- Storybook configured with @sass-factory/tokens CSS imported in preview
- Changesets configured for version management

Tier 1 components (all with full Vitest tests + Storybook stories):
  - Button (4 variants × 3 sizes, loading spinner, disabled state)
  - Input (text/number/tel, label, error, hint, v-model)
  - Card (header/body/footer slots, padding/shadow/border props)
  - Badge (5 variants: info/success/warning/error/neutral, dot option)
  - Modal (v-model open/close, overlay click, portal, size variants)
  - Toast (4 variants, auto-dismiss with duration, dismissible)
  - Skeleton (text/card/image/circle, pulse animation)
  - Table (sortable columns, empty state, loading skeleton rows)

Tier 2 components (domain-aware, still publishable):
  - StatusBadge (7 business statuses → correct colors from design tokens)
  - PriceDisplay (MXN formatting, crossed-out original price)
  - ImageUpload (drag-drop, JPEG/PNG/WebP only, 2MB limit, SVG rejection)

Tier 3 NOT included — will be implemented in apps during Sprint 3 and 4.

## Pre-merge checklist
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes — all component tests green
- [ ] `pnpm --filter @sass-factory/ui storybook` builds and opens in browser
- [ ] `pnpm --filter @sass-factory/tokens build` outputs dist/tokens.css
- [ ] tokens.css contains --sf-color-primary-500, --sf-status-active-bg, --sf-shadow-md
- [ ] All 8 Tier 1 and 3 Tier 2 components have at least 5 unit tests each
- [ ] StatusBadge shows correct color class for all 7 business statuses
- [ ] ImageUpload rejects SVG files with correct error message
- [ ] ImageUpload rejects files > 2MB with correct error message
- [ ] A changeset file is included in this MR
- [ ] packages/tokens and packages/ui have publishConfig pointing to GitHub Packages
```

---

## Definition of Done

- [ ] `packages/tokens` builds to `dist/tokens.css` with all CSS variables present
- [ ] `packages/ui` Storybook builds without errors (`pnpm build-storybook`)
- [ ] All 11 components (8 Tier 1 + 3 Tier 2) have passing Vitest tests
- [ ] `pnpm typecheck` exits 0 across all packages
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0 (all component tests pass)
- [ ] StatusBadge correctly applies distinct CSS class for each of the 7 business statuses
- [ ] ImageUpload emits `error` for SVG and files over 2MB; emits `update:modelValue` for valid JPEG/PNG/WebP
- [ ] Modal closes when overlay clicked (closeOnOverlay=true); does not close when false
- [ ] Table emits `sort` event with column key and direction when sortable header clicked
- [ ] A `.changeset/*.md` file is included in the MR
- [ ] MR opened to `develop`, Erick reviewed and approved, merged
