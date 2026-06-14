## Quick Context
**Stack**: React (admin-fe) + Next.js 15 (storefront-fe, landing-fe) + FastAPI services, Firebase Auth, Firestore, pnpm monorepo (Node ≥20)
**Key services**: Firebase Firestore (data), GCP Cloud Run (deploy), Firebase Auth (identity)
**Entry points**: `apps/admin-fe` → localhost:3000 | `apps/storefront-fe` → localhost:3010 | `apps/landing-fe` → localhost:3020 | `apps/catalog-api` → localhost:8000
**Tests**: `pnpm -F @eguru/core test` | `pnpm -F admin-fe test` | `cd apps/catalog-api && uv run pytest -q`
**Dev**: `make up service=landing-fe` | `make up service=storefront-fe` | `make up service=admin-fe` | `make up service=catalog-api`

## Independent Modules
| Module | Directory | Notes |
|--------|-----------|-------|
| admin-fe | `apps/admin-fe/src/` | React + Vite; pages, hooks, components, Zustand auth store |
| storefront-fe | `apps/storefront-fe/` | Next.js 15 App Router; public catalog pages per slug |
| landing-fe | `apps/landing-fe/` | Next.js 15 marketing site |
| catalog-api | `apps/catalog-api/app/` | FastAPI; routers, RBAC middleware, Firestore client |
| core-types | `packages/core/src/` | Shared TS types — Business, Item, BusinessStatus enum |

**Shared files (coordinate before editing):**
- `pnpm-lock.yaml` — monorepo lock file, high merge conflict risk
- `pnpm-workspace.yaml` — workspace definition
- `packages/core/src/index.ts` — barrel export; changes break all consumers
- `.github/workflows/deploy-dev.yml` — CI/CD pipeline

## Verification
```
pnpm -F @eguru/core typecheck        # core types
pnpm -F admin-fe typecheck           # admin
pnpm -F storefront-fe typecheck      # storefront
pnpm -F landing-fe typecheck         # landing
cd apps/catalog-api && uv run pytest -q
```

**Before finishing any PR, run the relevant live verification locally** — do
not declare a fix done on unit tests alone. Bring the real services up against
Firebase emulators in Docker (portable, no host installs) and exercise the
actual flow end-to-end. For identity-api auth flows: `make test-live`
(see `apps/identity-api/test/live/`). Add a live test when a PR fixes
behaviour that unit tests with mocks can't truly prove.

## @eguru Packages
All new UI components MUST go in `packages/ui/src/` and be exported from `packages/ui/src/index.ts`. Never create UI components directly inside `apps/`.

| Package | Location | Exports |
|---------|----------|---------|
| `@eguru/ui` | `packages/ui/src/` | Badge, Button, Card, Dialog, Input, Label, Separator, MobileSidebar, cn |
| `@eguru/core` | `packages/core/src/` | Business, Item, Prospect, Category, Click types; BusinessStatus, BusinessType enums; PLAN_LIMITS, PLAN_PRICES constants |
| `@eguru/auth` | `packages/auth/src/` | createAuthStore, useFirebaseAuthRestore, AuthUser, FirebaseConfig |
| `@eguru/client` | `packages/client/src/` | createApiClient, ApiClient, ApiClientConfig |

## Design System

Source of truth: `apps/admin-fe/src/components/ui/`
Rule: any panel UI (admin or owner) MUST use these components. Never use raw `<input>`, `<button>`, or ad-hoc wrappers when a component exists. This rule also applies to `apps/storefront-fe/components/ui/` (same shadcn components, copied per-app).

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

## Engineering Protocol

**Do not code immediately.** First, analyze the issue and ask questions if anything is unclear.

Rules:
- Do not guess.
- Do not invent requirements.
- Do not refactor unrelated code.
- Do not change files outside the required scope.
- Avoid hardcoded magic values (numbers, strings, limits). Define them as named constants in the relevant `*Constants.ts` file (or co-located near usage) and reuse them — never repeat the same literal across the JSX/logic.
- In PRs, prefer existing enum members over hardcoded string/number literals for domain values (status, role, type, etc.). If no matching enum member exists across services, flag the cross-service enum gap instead of adding a raw literal.
- Before editing, explain the root cause hypothesis.
- Before editing, list the files you plan to touch.
- Before editing, list the risks and affected flows.
- If the issue may affect mobile, iOS, responsive design, authentication, deployment, images, or storefront rendering, explicitly validate that.
- If you need more information, ask before implementing.
- Make small, isolated changes.
- After coding, provide a verification checklist.

Issue template:

**Task**: [DESCRIBE THE ISSUE HERE]
**Expected behavior**: [WRITE WHAT SHOULD HAPPEN]
**Current behavior**: [WRITE WHAT IS HAPPENING]
**Evidence**: [ADD SCREENSHOTS, URL, DEVICE, BROWSER, STEPS TO REPRODUCE]

**Definition of done:**
- Build passes.
- No unrelated UI changes.
- Desktop works.
- Mobile responsive works.
- iOS Safari works if applicable.
- The change is visible after deployment.
- Existing flows are not broken.
