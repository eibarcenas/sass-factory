## Quick Context
**Stack**: Nuxt 4 + Vue 3, UnoCSS, Firebase/Firestore, Nitro/H3, pnpm monorepo (Node ≥20)
**Key services**: Firebase Firestore (data), GCP Cloud Run (prod), Anthropic Claude API (app generation)
**Entry points**: `apps/admin` → localhost:3000 | `apps/template` → localhost:3010+ (spawned per slug)
**Tests**: No test suite — use `pnpm typecheck` for verification
**Dev**: `pnpm dev:admin` | `pnpm dev:emulator` (with Firestore) | `pnpm dev:app <slug>` (template)

## Independent Modules
| Module | Directory | Notes |
|--------|-----------|-------|
| admin-frontend | `apps/admin/app/` | Pages, composables, layouts — no shared server state |
| admin-server | `apps/admin/server/` | Nitro API routes + simulators; owns job/notification stores |
| template-app | `apps/template/` | Standalone themed SaaS starter; spawned per app slug |
| core-types | `packages/core/src/types/` | `AppConfig`, `AppTheme`, `TOPIC_PRESETS` — read by all |
| core-utils | `packages/core/src/utils/` | Firestore collection constants |
| ui-components | `packages/ui/src/components/` | `AppCard`, `ThemePicker`, `FeatureToggle` — admin only |
| infrastructure | `infrastructure/` | Terraform, k8s manifests, Cloud Build, dev scripts |

**Shared files (coordinate before editing):**
- `pnpm-lock.yaml` — monorepo lock file, high merge conflict risk
- `pnpm-workspace.yaml` — workspace definition
- `package.json` (root, apps/admin, apps/template, packages/core, packages/ui)
- `packages/core/src/index.ts` — barrel export; changes break all consumers
- `packages/core/src/types/app.ts` — type signatures consumed by admin + template + ui
- `firebase.json` / `.firebaserc` — shared Firebase project config
- `.github/workflows/deploy.yml` — CI/CD pipeline

## Verification
```
pnpm typecheck       # type-check all packages
pnpm lint            # ESLint across all packages
pnpm build:all       # full monorepo build
pnpm build:admin     # admin only
```

## Architecture Notes
4 deployment modes: mock (useState, zero config), local Docker (local-simulator.ts), GCP Cloud Build (Terraform per-app GCP projects), and Kubernetes (kind local / Cloud Run prod). Admin streams infra progress to UI via SSE (server-sent events). Template apps are dynamically spawned by `infrastructure/scripts/dev-app.mjs` and assigned stable ports tracked in `.dev-ports.json` (gitignored). `@sass-factory/core` is the single source of truth for types — changing exported signatures requires updating both apps simultaneously.
