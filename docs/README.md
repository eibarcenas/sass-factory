# sass-factory — Documentation Index

> All documents and code are in English. Diagrams use ASCII art.

## Structure

```
docs/
├── product/            Business and product decisions
├── architecture/       Technical architecture decisions
├── infrastructure/     GCP, Terraform, security, monitoring
├── development/        Coding standards, testing, tooling
├── mvp/                Early product notes and prototypes
└── planning/           Sprint backlog and confirmed decisions
```

---

## Product

| File | Contents |
|------|----------|
| [mvp/idea.md](mvp/idea.md) | Early MVP product concept |
| [mvp/gorras-bebes.html](mvp/gorras-bebes.html) | Early static catalog prototype |
| [product/overview.md](product/overview.md) | Platform overview, actors, business model, subscription tiers, templates |
| [product/analytics-billing.md](product/analytics-billing.md) | Analytics panel, invoice generation, charts implementation |
| [product/ui-wireframes.md](product/ui-wireframes.md) | ASCII wireframes: storefront, owner dashboard, admin panel |

## Architecture

| File | Contents |
|------|----------|
| [architecture/system-overview.md](architecture/system-overview.md) | ✅ Source of truth — monorepo, request flows, auth, Firestore schema, state machine, CI/CD |
| [architecture/nomenclature.md](architecture/nomenclature.md) | Deployable naming rules: `-api`, `-fe`, `-mfe`, `-webhook` |
| [architecture/eda-nomenclature.md](architecture/eda-nomenclature.md) | Event, Pub/Sub topic, subscription, and subscriber naming |
| [architecture/api-clean-architecture.md](architecture/api-clean-architecture.md) | FastAPI clean architecture layers and compatibility notes |
| [architecture/database.md](architecture/database.md) | Firestore schema detail (partially stale — system-overview.md is authoritative) |
| [architecture/auth-firebase-iap.md](architecture/auth-firebase-iap.md) | Firebase + IAP decision record |
| [architecture/multi-tenancy.md](architecture/multi-tenancy.md) | Multi-tenant routing, custom domains |
| [architecture/error-handling.md](architecture/error-handling.md) | Error handling strategy |
| [architecture/rbac.md](architecture/rbac.md) | @sass-factory/rbac library: permissions, Guard, Gate, middleware |
| [architecture/event-driven.md](architecture/event-driven.md) | Cloud Run + Eventarc, CloudEvents format, 3 async workers |
| [architecture/error-handling.md](architecture/error-handling.md) | Error code catalog, DomainError, fastapi.status enums, frontend translation |
| [architecture/i18n.md](architecture/i18n.md) | next-intl setup, locale detection, messages structure |

## Infrastructure

| File | Contents |
|------|----------|
| [infrastructure/terraform.md](infrastructure/terraform.md) | Reusable GCP Terraform modules: Firestore, Storage, Secret Manager, budget, monitoring |
| [infrastructure/security.md](infrastructure/security.md) | Auth flow, Custom Claims, CSP headers, Firestore rules + test cases |
| [infrastructure/monitoring.md](infrastructure/monitoring.md) | Health checks, structured logging, SLOs, rollback, cost model, GDPR |

## Development

| File | Contents |
|------|----------|
| [development/monorepo.md](development/monorepo.md) | pnpm workspaces + Turborepo structure, full stack definition |
| [development/best-practices.md](development/best-practices.md) | TypeScript rules, Zod, Result pattern, ESLint, commit conventions |
| [development/testing.md](development/testing.md) | Mandatory testing: unit (Fakes), integration (Emulator), E2E (Playwright), CI gates |
| [development/notifications.md](development/notifications.md) | Sonner toast setup, useApiError hook, mutation patterns |

## Planning

| File | Contents |
|------|----------|
| [planning/decisions.md](planning/decisions.md) | All confirmed architectural decisions |
| [planning/sprint-backlog.md](planning/sprint-backlog.md) | Sprint 0–7 task breakdown |

---

## Key Decisions (quick reference)

| Decision | Choice | Reason |
|----------|--------|--------|
| Frontend framework | Next.js 15 App Router | RSC, ISR, App Hosting native |
| Backend language | Python 3.13 + FastAPI | Async I/O, uvloop, hexagonal |
| Database | Firestore Native mode | Real-time, Auth integration, vector search |
| Backend architecture | Modular Monolith (hexagonal) | Simple ops, extractable domains |
| Event format | CloudEvents v1.0 (CNCF) | Standard, tooling support |
| Async workers | Cloud Run + Eventarc | No Cloud Functions SDK, same Terraform module |
| RBAC | @sass-factory/rbac (permissions, not roles) | Auth0 model, reusable |
| Error strategy | Backend returns codes, frontend translates | i18n-ready, clean contract |
| Notifications | Sonner + useApiError() | Lightweight, accessible |
| Monorepo | pnpm workspaces + Turborepo | Remote cache on GCS |
| IaC | Terraform ≥ 1.7 + GCP reusable modules | Consistent envs, no manual config |
