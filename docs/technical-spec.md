# Technical Specification

> This file has been split into focused topic files. See [docs/README.md](README.md) for the full index.

## Quick Navigation

### Product
- [Overview, business model, tiers, templates](product/overview.md)
- [UI wireframes (storefront, dashboard, admin)](product/ui-wireframes.md)
- [Analytics & billing panel](product/analytics-billing.md)

### Architecture
- [System overview, GCP diagram, request flows](architecture/system-overview.md)
- [Backend — Python FastAPI + Hexagonal](architecture/backend.md)
- [Database — Firestore schema, indexes, PITR](architecture/database.md)
- [Multi-tenancy — slug/subdomain/custom domain routing](architecture/multi-tenancy.md)
- [RBAC — permissions, roles, guard, middleware](architecture/rbac.md)
- [Error handling — codes, DomainError, HTTP mapping](architecture/error-handling.md)
- [i18n — next-intl, locale detection, messages](architecture/i18n.md)
- [Event-driven — Cloud Run + Eventarc + CloudEvents](architecture/event-driven.md)
- [Microservices — modular monolith vs. microservices](architecture/microservices.md)

### Infrastructure
- [Security — auth flow, CSP, Firestore rules, rate limiting](infrastructure/security.md)
- [Monitoring — health checks, SLOs, logging, cost model](infrastructure/monitoring.md)
- [Terraform — reusable GCP modules](infrastructure/terraform.md)

### Development
- [Monorepo structure & stack definition](development/monorepo.md)
- [Best practices — TypeScript, Python, Zod, ESLint](development/best-practices.md)
- [Testing strategy — Fakes, Emulator, Playwright, CI](development/testing.md)
- [Notifications — Sonner, useApiError, mutation patterns](development/notifications.md)

### Planning
- [Confirmed decisions](planning/decisions.md)
- [Sprint backlog (Sprint 0–7)](planning/sprint-backlog.md)
