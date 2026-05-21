# Environments — catalog.mx

> Last updated: 2026-05-21
> Stack: React (admin) · Next.js 15 (storefront) · FastAPI (API) · GCP Cloud Run · Firestore

---

## Overview

| Environment | GCP Project | Branch | Deploy | Purpose |
|------------|------------|--------|--------|---------|
| **dev** | `ei-catalog-dev` | `develop` | Automatic on push | Active development |
| **stg** | `ei-catalog-stg` | `release/**` | Automatic on push | QA / pre-release validation |
| **prod** | `ei-catalog-prod` | `production` | Manual approval + canary | Live product |

---

## dev — ei-catalog-dev

**GCP Project:** `ei-catalog-dev` (project number: `118838244106`)

| Service | URL |
|---------|-----|
| **Admin panel** | https://catalog-mx-admin-q3peeste7q-uc.a.run.app |
| **Storefront** | https://catalog-mx-storefront-q3peeste7q-uc.a.run.app |
| **API** | https://catalog-mx-api-q3peeste7q-uc.a.run.app |
| **API docs (Swagger)** | https://catalog-mx-api-q3peeste7q-uc.a.run.app/docs |
| **Demo example** | https://catalog-mx-storefront-q3peeste7q-uc.a.run.app/demo/heladeria-el-pinguino |

**Infrastructure:**
- Firestore: `ei-catalog-dev` / `us-central1` / free tier
- Images bucket: `gs://ei-catalog-images-dev`
- Artifact Registry: `us-central1-docker.pkg.dev/ei-catalog-dev/catalog-mx`
- WIF Provider: `projects/118838244106/.../github-pool/providers/github-provider`

---

## stg — ei-catalog-stg

**GCP Project:** `ei-catalog-stg` (project number: `384337544778`)

| Service | URL |
|---------|-----|
| **Admin panel** | _not yet deployed_ |
| **Storefront** | _not yet deployed_ |
| **API** | _not yet deployed_ |

**Deploy:** Push to `release/**` branch → auto-deploy via GitHub Actions

**Infrastructure:**
- Firestore: pending (`gcloud firestore databases create --project=ei-catalog-stg`)
- Artifact Registry: `us-central1-docker.pkg.dev/ei-catalog-stg/catalog-mx`
- WIF Provider: `projects/384337544778/.../github-pool/providers/github-provider`

---

## prod — ei-catalog-prod

**GCP Project:** `ei-catalog-prod` (project number: `633619387575`)

| Service | URL |
|---------|-----|
| **Admin panel** | _not yet deployed_ |
| **Storefront** | _not yet deployed_ |
| **API** | _not yet deployed_ |

**Deploy:** Push to `production` → manual approval in GitHub → canary 10% for 5 min → 100%

**Infrastructure:**
- Firestore: pending (`gcloud firestore databases create --project=ei-catalog-prod`)
- Artifact Registry: `us-central1-docker.pkg.dev/ei-catalog-prod/catalog-mx`
- WIF Provider: `projects/633619387575/.../github-pool/providers/github-provider`

---

## CI/CD — Deployment flow

```
developer pushes code
    │
    ├── develop ──────────────────────► ei-catalog-dev (auto, ~5 min)
    │                                   CI: typecheck + tests + deploy
    │
    ├── release/v* ───────────────────► ei-catalog-stg (auto, ~5 min)
    │                                   CI: tests + deploy + smoke test
    │
    └── production ───────────────────► ei-catalog-prod (manual approval)
                                        Canary: 10% traffic → 5 min wait → 100%
```

## GitHub Actions variables

| Variable | dev | stg | prod |
|---------|-----|-----|------|
| `WIF_PROVIDER_{ENV}` | ✅ | ✅ | ✅ |
| `DEPLOYER_SA_{ENV}` | ✅ | ✅ | ✅ |
| `RUNTIME_SA_{ENV}` | ✅ | ✅ | ✅ |

All authentication uses **Workload Identity Federation** — no service account keys stored in GitHub.

---

## Terraform

```bash
# Apply infrastructure (run once per env)
cd infrastructure/iterraform/setup
./scripts/apply.sh dev    # or stg / prod

# Deploy app layer (run after setup)
cd infrastructure/iterraform/app
terraform init -backend-config=environments/dev/backend.hcl
terraform apply -var-file=environments/dev/plain.auto.tfvars
```

---

## Local development

```bash
make dev-api        # FastAPI on :8000 (reads from Firestore ei-catalog-dev)
make dev-admin      # React admin on :3000 (mock mode without Firebase)
make dev-storefront # Next.js storefront on :3010
```

See `docs/sales/pitch-script.md` for the sales demo flow.
