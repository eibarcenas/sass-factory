# Confirmed Decisions

All decisions below are locked and reflected in the codebase architecture.

## Product Decisions

| Decision | Answer |
|----------|--------|
| Product name | Dynamically configurable (stored in Firestore, not hardcoded) |
| Price visibility | Toggle per business — admin or super admin enables/disables |
| Business registration | Admin creates businesses (MVP); self-serve is Sprint 1+ |
| Templates | Full redesign to match demo quality |
| Domain phase 1 | `platform.com/[slug]` |
| Domain phase 2 | `subdomain.platform.com` (Pro) → `customdomain.com` (Growth) |

## Stack Decisions

| Decision | Answer | Reason |
|----------|--------|--------|
| Frontend framework | Next.js 15 (App Router) | SSR, ISR, React Server Components |
| Frontend architecture | Feature-Sliced Design (FSD) | Enforced import boundaries, scalable |
| Backend language | Python 3.13 + FastAPI | Async, typed, hexagonal architecture |
| Backend architecture | Modular Monolith (MVP) | Microservices-ready by design via hexagonal |
| Database | Firestore Native mode | Real-time, vector search, Firebase Auth integration |
| Event system | Cloud Run + Eventarc (CloudEvents) | No Cloud Functions SDK, same infra module |
| Auth | Firebase Auth + Custom Claims | JWT-based RBAC, no role field in Firestore |
| Storage | Cloud Storage | Signed URLs, CDN, lifecycle rules |
| Package manager (TS) | pnpm workspaces + Turborepo | Remote cache, deterministic installs |
| Package manager (Python) | uv | 10-100x faster than pip, deterministic lockfile |
| IaC | Terraform ≥ 1.7 | Reusable GCP modules, state in GCS |
| Notifications | Sonner | < 3 KB, accessible, zero dependencies |
| Error strategy | Backend returns codes, frontend translates | i18n-ready, stable contracts |

## Architecture Decisions

| Decision | Answer |
|----------|--------|
| RBAC implementation | `@sass-factory/rbac` package — permissions, roles, guard, middleware, hooks |
| RBAC enforcement | FastAPI dependency (backend) + Next.js middleware (frontend) |
| Error codes | Defined in `packages/core/src/errors/codes.ts` — shared source of truth |
| Slug uniqueness | Firestore transaction on `slugs/` collection — O(1), no race condition |
| Multi-tenancy | Slug-based (Starter) → Subdomain (Pro) → Custom domain (Growth) |
| Image processing | Async via Cloud Run workers + Eventarc (Storage trigger) |
| Click tracking | Dual-write: GA4 (platform analytics) + Firestore (per-business billing) |
| i18n | next-intl in both apps; backend returns error codes, never messages |
| Testing | Fakes (not mocks) for unit tests; Firebase Emulator for integration |
| Python event loop | uvloop — 2-4x faster async I/O vs default asyncio |
| Workers | 1 Cloud Run service (`apps/workers`) — 3 handlers via Eventarc |

## What Was Dropped / Not Built

| Item | Decision |
|------|----------|
| Cloud Functions SDK | Dropped — Cloud Run + Eventarc is cleaner and reuses same Terraform module |
| Barrel files (index.ts re-exports) | Banned — cause circular deps, slow TypeScript, break tree-shaking |
| Default exports | Banned (except Next.js pages) — named exports only |
| Per-client deployments | Anti-pattern — one shared app reads slug/domain to determine business |
| MongoDB Compatibility Layer | Not used for MVP — Firestore SDK pure; MongoDB compat is Enterprise upgrade path |
| Free-threaded Python (no-GIL) | Not used — experimental in 3.13, uvloop handles I/O throughput |
| Microservices | Not for MVP — modular monolith with hexagonal arch is extraction-ready |
