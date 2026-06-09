# SASS Factory

> Multi-tenant SaaS platform — businesses create catalog pages, customers browse and order via WhatsApp.

**Stack:** React + Vite (admin) · Next.js 15 App Router (storefront, landing) · FastAPI (APIs) · Firebase Auth + Firestore · GCP Cloud Run · pnpm workspaces

---

## Quick Start

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20 | Use nvm |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| Python | ≥ 3.11 | For FastAPI services |
| uv | latest | `pip install uv` |

### 1. Install

```bash
git clone https://github.com/eibarcenas/sass-factory.git
cd sass-factory
make install
```

### 2. Start services

```bash
# Individual services
make up service=admin-fe          # http://localhost:3000
make up service=store-fe          # http://localhost:3010
make up service=landing-fe        # http://localhost:3020
make up service=stores-api        # http://localhost:8000
make up service=identity-api      # http://localhost:8001
make up service=prospects-api     # http://localhost:8003
make up service=notifications-webhook  # http://localhost:8004

# All services at once
make up service=all

# Show all ports
make ports
```

### 3. Stop services

```bash
make down service=admin-fe        # Stop one service
make down service=all             # Stop all services
```

The admin runs in **mock mode** automatically when no Firebase keys are set — no credentials needed for local UI development.

---

## Service Map

| Service | Directory | Port | Tech |
|---------|-----------|------|------|
| `admin-fe` | `apps/admin-fe/` | 3000 | React + Vite |
| `store-fe` | `apps/store-fe/` | 3010 | Next.js 15 |
| `landing-fe` | `apps/landing-fe/` | 3020 | Next.js 15 |
| `stores-api` | `apps/stores-api/` | 8000 | FastAPI |
| `identity-api` | `apps/identity-api/` | 8001 | FastAPI |
| `prospects-api` | `apps/prospects-api/` | 8003 | FastAPI |
| `notifications-webhook` | `apps/notifications-webhook/` | 8004 | FastAPI |

---

## Make Reference

```
make help                    # Show all available targets

# Dev
make up service=<name>       # Start one service (or "all")
make down service=<name>     # Stop one service (or "all")
make status                  # Show active listeners on canonical ports
make ports                   # Print port map

# Aliases
make dev-admin               # Alias for make up service=admin-fe
make dev-store               # Alias for make up service=store-fe
make dev-api                 # Alias for make up service=stores-api

# Quality
make install                 # Install all pnpm + uv dependencies
make test                    # Run unit tests (Vitest + pytest)
make test-unit               # Vitest only
make test-api                # pytest only (stores-api)
make test-e2e                # Playwright E2E
make typecheck               # TS typecheck all packages
make lint                    # Lint all packages

# Deploy
make deploy service=<name>   # Deploy one service to Cloud Run
make deploy service=all      # Deploy all services
```

---

## Architecture

```
BROWSER
┌─────────────────────────────────────────────────┐
│  Admin Panel        http://localhost:3000        │
│  (React + Vite)     Firebase Auth + Firestore    │
│                                                  │
│  Storefront         http://localhost:3010        │
│  (Next.js 15)       Public catalog per slug      │
│                                                  │
│  Landing            http://localhost:3020        │
│  (Next.js 15)       Marketing site               │
└────────────────────────┬────────────────────────┘
                         │ REST / Firebase SDK
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
  │ stores-api   │ │identity-api  │ │ prospects-api        │
  │ :8000        │ │ :8001        │ │ :8003                │
  │ FastAPI      │ │ FastAPI      │ │ FastAPI              │
  │ Catalog CRUD │ │ Auth/Users   │ │ Lead capture         │
  └──────┬───────┘ └──────┬───────┘ └──────────────────────┘
         │                │
         ▼                ▼
  ┌─────────────────────────────┐
  │  Firebase Firestore          │
  │  Firebase Auth (custom claims│
  │  role + business_id)         │
  └─────────────────────────────┘
         │
         ▼
  ┌──────────────────────┐
  │ notifications-webhook│
  │ :8004 — FastAPI      │
  │ WhatsApp / email     │
  └──────────────────────┘
```

### Auth model

- `SUPER_ADMIN` — manages all businesses and demo data
- `OWNER` — manages their own business catalog
- Firebase custom claims carry `role` and `business_id`
- API enforces RBAC via `require_role()` / `require_owner_or_admin()` FastAPI dependencies
- Mock mode: admin works without Firebase keys (Zustand mock user)

---

## Project Structure

```
sass-factory/
├── apps/
│   ├── admin-fe/            # React + Vite admin panel
│   │   └── src/
│   │       ├── pages/       # DashboardPage, owner pages
│   │       ├── hooks/       # useGoogleAuth, etc.
│   │       ├── components/  # layout, ui (shadcn)
│   │       └── store/       # Zustand auth store
│   │
│   ├── store-fe/            # Next.js 15 public storefront
│   │   └── app/             # App Router — catalog pages per slug
│   │
│   ├── landing-fe/          # Next.js 15 marketing site
│   │
│   ├── stores-api/          # FastAPI — catalog CRUD + RBAC
│   │   └── app/
│   │       ├── routers/
│   │       ├── middleware/  # RBAC
│   │       └── firestore.py
│   │
│   ├── identity-api/        # FastAPI — user / auth management
│   ├── prospects-api/       # FastAPI — lead capture
│   └── notifications-webhook/ # FastAPI — WhatsApp / email triggers
│
├── packages/
│   ├── core/                # @eguru/core — shared TS types + enums
│   │   └── src/             # Business, Item, Prospect, Category, Click
│   │                        # BusinessStatus, BusinessType, PLAN_LIMITS
│   ├── ui/                  # @eguru/ui — shared Vue components
│   │   └── src/             # Badge, Button, Card, Dialog, Input…
│   ├── auth/                # @eguru/auth — Firebase auth store
│   └── client/              # @eguru/client — API client factory
│
├── infrastructure/
│   ├── cloudbuild/
│   ├── terraform/
│   ├── firestore/
│   │   ├── rules.firestore
│   │   ├── indexes.json
│   │   └── seed.ts
│   └── scripts/
│
├── Makefile
├── pnpm-workspace.yaml
└── firebase.json
```

---

## Environment Variables

### Frontend apps (`apps/admin-fe/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_STORES_API_URL` | Yes | `http://localhost:8000` |
| `VITE_IDENTITY_API_URL` | Yes | `http://localhost:8001` |
| `VITE_PROSPECTS_API_URL` | Yes | `http://localhost:8003` |
| `VITE_ADMIN_URL` | Yes | `http://localhost:3000` |
| `VITE_STORE_URL` | Yes | `http://localhost:3010` |
| `VITE_LANDING_URL` | Yes | `http://localhost:3020` |
| `VITE_FIREBASE_*` | Optional | Enables real Firestore (6 vars) |

Without `VITE_FIREBASE_*` → **mock mode activates automatically**.

### API services (`apps/stores-api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | Path to service account JSON |
| `ENVIRONMENT` | Yes | `local` \| `development` \| `production` |

---

## Testing

```bash
make test                    # All tests

# Individual suites
pnpm -F @eguru/core test
pnpm -F admin-fe test
cd apps/stores-api && DEV_USER_EMAIL=dev@test.local ENVIRONMENT=local uv run pytest -q
```

---

## Type-checking

```bash
make typecheck               # All packages

# Individual
pnpm -F @eguru/core typecheck
pnpm -F admin-fe typecheck
pnpm -F store-fe typecheck
pnpm -F landing-fe typecheck
```

---

## Deploy to GCP Cloud Run

```bash
# Deploy one service
make deploy service=admin-fe

# Deploy all services
make deploy service=all

# Target a specific project/region
make deploy service=stores-api project-id=my-project region=us-central1
```

Defaults: `project-id=catalog-mx-dev`, `region=us-central1`.

### Required GitHub Secrets

```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT    # Firebase Hosting deploy key (JSON)
GCP_SERVICE_ACCOUNT_KEY     # Cloud Run deploy key (JSON)
GCP_PROJECT_ID
GCP_REGION
```

---

## Branches

| Branch | Purpose |
|--------|---------|
| `develop` | Active development — all PRs target here |
| `main` | Production — merging triggers deploys |

---

## Firestore Schema

```
businesses/{businessId}
  id, name, slug, status (draft|active|archived)
  ownerId, plan, features[]
  theme: { primary, secondary, font, logo }
  whatsapp: string
  createdAt, updatedAt

businesses/{businessId}/items/{itemId}
  id, name, description, price
  category, images[], available
  createdAt, updatedAt
```
