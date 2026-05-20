# Design System — catalog.mx

Custom CSS without Tailwind. CSS Custom Properties + CSS Modules.

## Why custom CSS

- You own every line — no framework to learn or upgrade
- CSS Custom Properties are native browser tech, zero build tools
- CSS Modules scope styles per component, no class name collisions
- Easier to read, debug and maintain than utility classes

## Stack

```
CSS Custom Properties   → design tokens (colors, spacing, type)
CSS Modules (.module.css) → component-scoped styles
Global stylesheet       → tokens + reset + base typography
```

No Sass, no PostCSS plugins, no Tailwind, no styled-components.

---

## Design Tokens — CSS Custom Properties

All tokens are defined in `src/styles/tokens.css` and imported once in the app root.

### Colors

```css
:root {
  /* Brand */
  --color-brand-50:  #f0fdf4;
  --color-brand-100: #dcfce7;
  --color-brand-500: #22c55e;
  --color-brand-600: #16a34a;
  --color-brand-700: #15803d;

  /* Neutral */
  --color-neutral-0:   #ffffff;
  --color-neutral-50:  #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  /* Semantic */
  --color-primary:   #6366f1;  /* indigo — admin actions */
  --color-success:   #22c55e;  /* green — active, confirmed */
  --color-warning:   #f59e0b;  /* amber — pending, sent */
  --color-error:     #ef4444;  /* red — suspended, delete */
  --color-info:      #3b82f6;  /* blue — demo, info */

  /* Business status */
  --status-draft-bg:    #f1f5f9; --status-draft-text:    #475569;
  --status-demo-bg:     #eff6ff; --status-demo-text:     #1d4ed8;
  --status-sent-bg:     #fffbeb; --status-sent-text:     #b45309;
  --status-accepted-bg: #f0fdf4; --status-accepted-text: #15803d;
  --status-active-bg:   #ecfdf5; --status-active-text:   #065f46;
  --status-suspended-bg:#fef2f2; --status-suspended-text:#b91c1c;
}
```

### Spacing

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Typography

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  30px;
  --text-4xl:  36px;

  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  --leading-tight:  1.25;
  --leading-normal: 1.5;
}
```

### Borders & Shadows

```css
:root {
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

---

## Component Patterns

### CSS Module example — Button

```css
/* Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  font-family: var(--font-sans);
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.primary {
  background: var(--color-primary);
  color: white;
}
.primary:hover { background: #4f46e5; }

.secondary {
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
}
.secondary:hover { background: var(--color-neutral-200); }

.danger {
  background: var(--color-error);
  color: white;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

```tsx
// Button.tsx
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'danger'

interface Props {
  variant?: Variant
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export default function Button({ variant = 'primary', disabled, loading, onClick, children }: Props) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? '...' : children}
    </button>
  )
}
```

### Card

```css
/* Card.module.css */
.card {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.body { padding: var(--space-6); }
.header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-neutral-100);
}
.footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-neutral-100);
  background: var(--color-neutral-50);
}
```

### Input

```css
/* Input.module.css */
.wrapper { display: flex; flex-direction: column; gap: var(--space-1); }

.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-neutral-700);
}

.input {
  width: 100%;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  background: white;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
}

.error { color: var(--color-error); font-size: var(--text-xs); }
```

### StatusBadge

```css
/* StatusBadge.module.css */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}
.badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.7;
}

.draft    { background: var(--status-draft-bg);    color: var(--status-draft-text); }
.demo     { background: var(--status-demo-bg);     color: var(--status-demo-text); }
.sent     { background: var(--status-sent-bg);     color: var(--status-sent-text); }
.accepted { background: var(--status-accepted-bg); color: var(--status-accepted-text); }
.active   { background: var(--status-active-bg);   color: var(--status-active-text); }
.suspended{ background: var(--status-suspended-bg);color: var(--status-suspended-text); }
```

---

## File Structure

```
apps/admin/src/
  styles/
    tokens.css        ← all CSS custom properties (import once in main.tsx)
    reset.css         ← minimal reset
    global.css        ← body, headings, links
  components/
    ui/
      Button.tsx
      Button.module.css
      Input.tsx
      Input.module.css
      Card.tsx
      Card.module.css
      Badge.tsx        ← generic badge
      Badge.module.css
      StatusBadge.tsx  ← business status specific
      StatusBadge.module.css
      Modal.tsx
      Modal.module.css

apps/storefront/
  styles/
    tokens.css        ← same tokens, shared visual language
  components/
    (same pattern)
```

---

## Migration plan from Tailwind

1. Create `src/styles/tokens.css` — all CSS custom properties
2. Create `src/styles/reset.css` — minimal reset
3. Build each component with its own `.module.css`
4. Remove `tailwindcss` from `package.json` and `postcss.config.js`
5. Import `tokens.css` once in `main.tsx`

**Rule: no inline styles except for dynamic values (business theme colors).**
