## Quick Context
**Stack**: React (admin) + Next.js 15 (storefront) + FastAPI (API), Firebase Auth, Firestore, pnpm monorepo (Node ≥20)
**Key services**: Firebase Firestore (data), GCP Cloud Run (deploy), Firebase Auth (identity)
**Entry points**: `apps/admin` → localhost:5173 | `apps/storefront` → localhost:3000 | `apps/api` → localhost:8000
**Tests**: `pnpm -F @catalog-mx/core test` | `pnpm -F admin test` | `cd apps/api && .venv/bin/pytest -q`
**Dev**: `pnpm dev` (admin + storefront) | `pnpm -F admin dev` | `pnpm -F storefront dev`

## Independent Modules
| Module | Directory | Notes |
|--------|-----------|-------|
| admin-frontend | `apps/admin/src/` | React + Vite; pages, hooks, components, Zustand auth store |
| storefront | `apps/storefront/` | Next.js 15 App Router; public catalog pages per slug |
| api | `apps/api/app/` | FastAPI; routers, RBAC middleware, Firestore client |
| core-types | `packages/core/src/` | Shared TS types — Business, Item, BusinessStatus enum |

**Shared files (coordinate before editing):**
- `pnpm-lock.yaml` — monorepo lock file, high merge conflict risk
- `pnpm-workspace.yaml` — workspace definition
- `packages/core/src/index.ts` — barrel export; changes break all consumers
- `.github/workflows/deploy-dev.yml` — CI/CD pipeline

## Verification
```
pnpm -F @catalog-mx/core typecheck   # core types
pnpm -F admin typecheck              # admin
pnpm -F @catalog-mx/core test        # core unit tests
pnpm -F admin test                   # admin Vitest tests
cd apps/api && .venv/bin/pytest -q   # API tests
```

## @eguru Packages
All new UI components MUST go in `packages/ui/src/` and be exported from `packages/ui/src/index.ts`. Never create UI components directly inside `apps/`.

| Package | Location | Exports |
|---------|----------|---------|
| `@eguru/ui` | `packages/ui/src/` | Badge, Button, Card, Dialog, Input, Label, Separator, MobileSidebar, cn |
| `@eguru/core` | `packages/core/src/` | Business, Item, Prospect, Category, Click types; BusinessStatus, BusinessType enums; PLAN_LIMITS, PLAN_PRICES constants |
| `@eguru/auth` | `packages/auth/src/` | createAuthStore, useFirebaseAuthRestore, AuthUser, FirebaseConfig |
| `@eguru/client` | `packages/client/src/` | createApiClient, ApiClient, ApiClientConfig |

## Design System

Source of truth: `apps/admin/src/components/ui/`
Rule: any panel UI (admin or owner) MUST use these components. Never use raw `<input>`, `<button>`, or ad-hoc wrappers when a component exists. This rule also applies to `apps/storefront/components/ui/` (same shadcn components, copied per-app).

Components:
- `Card / CardHeader / CardTitle / CardContent` → section containers
- `Input + Label` → all form fields
- `Button (size + variant)` → all actions
- `Badge` → status labels
- `Separator` → visual dividers
- `MobileSidebar` (from `@eguru/ui`) → mobile drawer wrapper for sidebar

Tokens (never hardcode equivalent raw Tailwind):
- `bg-muted`, `text-muted-foreground`, `border-input`, `ring-ring`
- `bg-background` instead of `bg-white`
- `bg-primary/10 text-primary` for active nav states

## Architecture Notes
Multi-tenant SaaS: businesses create catalog pages, customers browse and order via WhatsApp. Admin (SUPER_ADMIN role) manages businesses and demos. Owners (OWNER role) manage their own business catalog. Auth uses Firebase custom claims (`role`, `business_id`). API enforces RBAC via `require_role()` / `require_owner_or_admin()` FastAPI dependencies. Storefront is public (no auth). Mock mode: admin works without Firebase keys (Zustand mock user), useful for local dev without credentials.

## Admin Layout Pattern
- `AdminLayout` in `apps/admin/src/pages/DashboardPage.tsx` owns the full shell (sidebar + main)
- `AppSidebar` in `apps/admin/src/components/layout/AppSidebar.tsx` is the shared sidebar (used by both admin and owner panels); accepts `onAfterNavigate` callback for closing mobile drawer after navigation
- `MobileSidebar` from `@eguru/ui` wraps the sidebar as a mobile drawer (hidden on `md:` and above)
- Desktop sidebar is wrapped in `hidden md:block`; mobile hamburger button is `md:hidden`
- Content padding: `p-4 md:p-8`

## Owner Panel
- `OwnerDashboardPage` at `apps/admin/src/pages/owner/OwnerDashboardPage.tsx` is a single-file panel
- Uses local `page` state (`'catalog' | 'appearance' | 'settings'`) — no sub-routes
- Routing: admin routes under `AdminLayout`; owner panel at `/owner/*` with `RequireOwner` guard in `App.tsx`; impersonation preview at `/owner/preview/:slug`

## Firebase Auth (Google Sign-In)
- `useGoogleAuth` hook at `apps/admin/src/hooks/useGoogleAuth.ts` handles mobile vs desktop sign-in
- On mobile (`/Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i`): uses `signInWithRedirect`; falls back to redirect on `auth/popup-blocked`
- On desktop: uses `signInWithPopup`
- Always calls `getRedirectResult()` on mount to handle redirect return
- RegisterPage persists `businessName` to `sessionStorage` before redirect (key: `pendingBusinessName`) so it survives the OAuth round-trip

## Mobile-First Rules
- All new layout grids must use responsive variants: `grid-cols-1 md:grid-cols-2`, `grid-cols-2 md:grid-cols-4`, etc.
- Sidebar is always hidden on mobile via `hidden md:block`; mobile navigation uses `MobileSidebar` drawer
- Content padding scales: `p-4 md:p-8`
- Kanban board uses `TouchSensor` (200ms delay) alongside `PointerSensor` for touch drag support
