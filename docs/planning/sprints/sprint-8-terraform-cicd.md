# Sprint 8 — Terraform + CI/CD + Multi-env

| Field | Value |
|---|---|
| Branch | `sprint/8-terraform-cicd` from `develop` |
| Status | ✅ Done |
| Stack | Terraform, GitHub Actions, WIF, GCP Cloud Run |
| Initiatives | Platform Core (infra) |
| Pre-condition | Sprint 7 merged to `develop` |

---

## Objective

Replace manual `gcloud` deploys with a fully automated IaC pipeline. Three GCP projects (`ei-catalog-dev`, `ei-catalog-stg`, `ei-catalog-prod`) each get their own service accounts, Workload Identity Federation, and GitHub Actions workflows. Terraform manages all Cloud Run services, Firestore, Secret Manager, and budget alerts.

---

## Terraform Structure

```
infrastructure/iterraform/
├── modules/
│   ├── cloud_run/         — Cloud Run v2 service + public IAM
│   ├── firestore/         — Firestore Native mode database
│   ├── storage/           — GCS bucket with lifecycle rules
│   ├── iam/               — SA bindings
│   ├── secret_manager/    — secret + SA accessor
│   ├── budget/            — billing budget alert ($40/mo)
│   └── monitoring/        — uptime checks, alert policies
├── setup/                 — run ONCE per env: WIF pool, SAs, Artifact Registry
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf         — SA emails + WIF provider resource name
└── app/
    └── dev/               — calls all modules; consumes setup/ outputs
        ├── main.tf
        ├── variables.tf
        └── terraform.tfvars
```

### Two-Layer Design

| Layer | Who runs it | When |
|---|---|---|
| `setup/` | Human (once) | When creating a new GCP project |
| `app/` | CI/CD (every deploy) | On every push to the protected branch |

`setup/` outputs (`service_account_email`, `workload_identity_provider`) are referenced by `app/` via Terraform remote state or env vars.

---

## Service Account Roles

| SA | Project | Roles |
|---|---|---|
| `catalog-mx-api@ei-catalog-dev` | `ei-catalog-dev` | `run.invoker`, `datastore.user`, `storage.objectAdmin`, `secretmanager.secretAccessor` |
| `catalog-mx-api@ei-catalog-dev` | `catalog-mx-dev` | `firebaseauth.admin`, `identitytoolkit.viewer` |
| `catalog-mx-deployer@ei-catalog-dev` | `ei-catalog-dev` | `run.admin`, `artifactregistry.writer`, `iam.serviceAccountTokenCreator` |

---

## CI/CD Pipelines

| File | Trigger | Deploys to |
|---|---|---|
| `.github/workflows/deploy-dev.yml` | push to `develop` | `ei-catalog-dev` |
| `.github/workflows/deploy-stg.yml` | push to `release/*` | `ei-catalog-stg` |
| `.github/workflows/deploy-prod.yml` | push to `production` | `ei-catalog-prod` |

Each workflow: build → push to Artifact Registry → `gcloud run deploy`.

---

## Cloud Run Naming Convention

`catalog-mx-{service}-{env}` → e.g., `catalog-mx-api-dev`, `catalog-mx-admin-stg`.

URLs: `catalog-mx-{service}-{env}-{hash}-uc.a.run.app`

---

## Environments

| Env | GCP Project | Firebase Project |
|---|---|---|
| dev | `ei-catalog-dev` | `catalog-mx-dev` |
| stg | `ei-catalog-stg` | `catalog-mx-stg` |
| prod | `ei-catalog-prod` | `catalog-mx-prod` |

---

## Tests

### Terraform Validation
- `terraform validate` passes for all modules
- `terraform plan` for `app/dev/` shows zero errors on a clean workspace

### Integration (smoke tests post-deploy)
- `GET /health` returns 200 on all three Cloud Run services after deploy
- Admin loads without JS errors (check browser console via Playwright)

### CI Checks
```
.github/workflows/deploy-dev.yml
  ✓ pnpm typecheck passes
  ✓ pnpm build:all succeeds
  ✓ docker build succeeds for all three services
  ✓ health check passes after deploy
```

---

## Acceptance Criteria

- [ ] `terraform validate` passes for all modules in `infrastructure/iterraform/`
- [ ] Push to `develop` triggers `deploy-dev.yml` and deploys to `ei-catalog-dev`
- [ ] All three Cloud Run services respond to `/health` after deploy
- [ ] No secrets in code — all credentials in Secret Manager or WIF
- [ ] Budget alert configured at $40/month for each GCP project
