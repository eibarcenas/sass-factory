# Environments — catalog.mx

> Last updated: 2026-05-21
> Stack: React (admin) · Next.js 15 (storefront) · FastAPI (API) · GCP Cloud Run · Firestore

---

## Overview

| Environment | GCP Project | Branch | Deploy | Purpose |
|------------|------------|--------|--------|---------|
| **dev** | `ei-catalog-dev` | `develop` | Auto on push | Active development |
| **stg** | `ei-catalog-stg` | `release/**` | Auto on push | QA / pre-release |
| **prod** | `ei-catalog-prod` | `production` | Manual approval + canary | Live product |

---

## dev — ei-catalog-dev

**GCP Project:** `ei-catalog-dev` · **Project number:** `118838244106`

| Service | URL |
|---------|-----|
| **Admin panel** (SUPER_ADMIN) | https://catalog-mx-admin-dev-q3peeste7q-uc.a.run.app |
| **Storefront admin panel** (OWNER) | https://catalog-mx-admin-dev-q3peeste7q-uc.a.run.app/owner |
| **Storefront** | https://catalog-mx-storefront-dev-q3peeste7q-uc.a.run.app |
| **API** | https://catalog-mx-api-dev-q3peeste7q-uc.a.run.app |
| **API docs (Swagger)** | https://catalog-mx-api-dev-q3peeste7q-uc.a.run.app/docs |
| **Demo example** | https://catalog-mx-storefront-dev-q3peeste7q-uc.a.run.app/demo/heladeria-el-pinguino |

**Infrastructure:**
- Firestore: `ei-catalog-dev` / `us-central1`
- Images bucket: `gs://ei-catalog-images-dev`
- Artifact Registry: `us-central1-docker.pkg.dev/ei-catalog-dev/catalog-mx`

---

## stg — ei-catalog-stg

**GCP Project:** `ei-catalog-stg` · **Project number:** `384337544778`

| Service | URL |
|---------|-----|
| **Admin panel** | _pending first deploy from `release/**`_ |
| **Storefront** | _pending_ |
| **API** | _pending_ |

**Service names (after first deploy):**
- `catalog-mx-admin-stg` (serves both SUPER_ADMIN `/` and OWNER `/owner`)
- `catalog-mx-api-stg`
- `catalog-mx-storefront-stg`

**Infrastructure:**
- Firestore: pending
- Artifact Registry: `us-central1-docker.pkg.dev/ei-catalog-stg/catalog-mx`

---

## prod — ei-catalog-prod

**GCP Project:** `ei-catalog-prod` · **Project number:** `633619387575`

| Service | URL |
|---------|-----|
| **Admin panel** | _pending first deploy from `production`_ |
| **Storefront** | _pending_ |
| **API** | _pending_ |

**Service names (after first deploy):**
- `catalog-mx-admin-prod` (serves both SUPER_ADMIN `/` and OWNER `/owner`)
- `catalog-mx-api-prod`
- `catalog-mx-storefront-prod`

**Infrastructure:**
- Firestore: pending
- Artifact Registry: `us-central1-docker.pkg.dev/ei-catalog-prod/catalog-mx`

---

## Planned custom domains

| Environment | Domain | Service |
|------------|--------|---------|
| dev | `dev.catalog.mx` | `catalog-mx-storefront-dev` |
| stg | `stg.catalog.mx` | `catalog-mx-storefront-stg` |
| prod | `catalog.mx` | `catalog-mx-storefront-prod` |

---

## CI/CD flow

```
git push develop    → ei-catalog-dev  (auto, ~5 min)
git push release/*  → ei-catalog-stg  (auto, ~5 min)
git push production → ei-catalog-prod (manual approval + canary 10%→100%)
```

## GitHub Actions variables

| Variable | dev | stg | prod |
|---------|:---:|:---:|:----:|
| `WIF_PROVIDER_{ENV}` | ✅ | ✅ | ✅ |
| `DEPLOYER_SA_{ENV}` | ✅ | ✅ | ✅ |
| `RUNTIME_SA_{ENV}` | ✅ | ✅ | ✅ |

Auth via **Workload Identity Federation** — no service account keys in GitHub.

---

## Terraform

```bash
# Apply infrastructure (once per env)
cd infrastructure/iterraform/_shared/setup
./scripts/apply.sh dev    # or stg / prod

# Deploy app layer
cd infrastructure/iterraform/_shared/app
terraform init -backend-config=environments/dev/backend.hcl
terraform apply -var-file=environments/dev/plain.auto.tfvars
```

## Local development

```bash
make dev-api        # FastAPI :8000
make dev-admin      # React :3000 (mock mode)
make dev-storefront # Next.js :3010
```
