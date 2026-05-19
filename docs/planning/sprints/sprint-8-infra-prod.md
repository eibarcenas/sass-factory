# Sprint 8 — Infra Producción

## Overview

| Field | Value |
|---|---|
| Branch | `sprint/8-infra-prod` from `develop` |
| Duration | 1 week |
| Agents | `terraform-agent` + `cicd-agent` + `monitoring-agent` (parallel after base Terraform) |
| Initiatives | Growth & Monetization (E15) |
| Pre-condition | Sprint 7 merged to `develop` |

## Objective

Provision full production infrastructure on GCP using Terraform, automate CI/CD pipelines with canary deployments, configure monitoring and alerting, set up custom domains with managed SSL, and implement GDPR data compliance. The three agents run in parallel once the Terraform base module is established by `terraform-agent` on day 1.

---

## Agent Coordination

| Agent | Owns | Starts |
|---|---|---|
| `terraform-agent` | All Terraform modules + environments, Secret Manager, Cloud Run config | Day 1 |
| `cicd-agent` | All GitHub Actions workflows, Artifact Registry config, Cloud Build integration | Day 1 (parallel with Terraform output values) |
| `monitoring-agent` | Cloud Monitoring dashboards, alert policies, budget alerts | Day 2 (after Terraform outputs the project ID) |

`terraform-agent` must output `project_id`, `artifact_registry_url`, and `cloud_run_service_urls` as Terraform outputs on day 1 so `cicd-agent` can hardcode them in workflow files.

---

## GCP Services to Provision

| Service | Purpose | Terraform Resource |
|---|---|---|
| Cloud Run (7 services) | App hosting | `google_cloud_run_v2_service` |
| Cloud Storage | Business logos, CDN | `google_storage_bucket` |
| Firestore | Native mode database | `google_firestore_database` |
| Secret Manager | API keys + tokens | `google_secret_manager_secret` |
| Cloud Load Balancer | Single IP, path routing | `google_compute_global_forwarding_rule` + backend services |
| Certificate Manager | Managed SSL `*.catalog.mx` | `google_certificate_manager_certificate` |
| Cloud Monitoring | Dashboards + alerts | `google_monitoring_dashboard` + `google_monitoring_alert_policy` |
| Cloud Scheduler | Daily referral rewards job | `google_cloud_scheduler_job` |
| Artifact Registry | Docker image storage | `google_artifact_registry_repository` |
| Budget | $40/month alert | `google_billing_budget` |

---

## Terraform Module Structure

```
infrastructure/terraform/
  modules/
    cloud_run/
      main.tf          ← google_cloud_run_v2_service + IAM
      variables.tf     ← service_name, image, env_vars, secrets, min/max instances
      outputs.tf       ← service_url, service_name
    cloud_storage/
      main.tf          ← bucket + CORS + lifecycle + CDN backend
      variables.tf     ← bucket_name, location, lifecycle_days
      outputs.tf       ← bucket_url, cdn_url
    secret_manager/
      main.tf          ← google_secret_manager_secret + version + IAM binding
      variables.tf     ← secret_id, secret_value (sensitive)
      outputs.tf       ← secret_id, secret_version_name
    load_balancer/
      main.tf          ← forwarding rule, URL map, backend services, health checks
      variables.tf     ← domain, services map
      outputs.tf       ← ip_address, url_map_id
    certificate_manager/
      main.tf          ← google_certificate_manager_certificate (managed)
      variables.tf     ← domain (*.catalog.mx)
      outputs.tf       ← certificate_id
    monitoring/
      main.tf          ← dashboards + alert policies + notification channels
      variables.tf     ← project_id, slack_webhook_url, pagerduty_service_key
      outputs.tf       ← dashboard_urls
    budget/
      main.tf          ← google_billing_budget
      variables.tf     ← billing_account_id, amount_usd, alert_emails
      outputs.tf       ← budget_id
    scheduler/
      main.tf          ← google_cloud_scheduler_job
      variables.tf     ← job_name, schedule, target_url, service_account
      outputs.tf       ← job_name
  environments/
    dev/
      main.tf          ← calls all modules with dev values
      terraform.tfvars ← dev project_id, min_instances=0, etc.
      backend.tf       ← GCS backend: gs://catalog-tfstate-dev/terraform.tfstate
    stg/
      main.tf
      terraform.tfvars
      backend.tf       ← GCS backend: gs://catalog-tfstate-stg/terraform.tfstate
    prod/
      main.tf
      terraform.tfvars ← min_instances=1 for storefront+admin, max_instances=20
      backend.tf       ← GCS backend: gs://catalog-tfstate-prod/terraform.tfstate
  main.tf              ← provider config + required_providers
  variables.tf         ← global variables
  outputs.tf           ← outputs consumed by CI/CD
```

### Cloud Run Module (`modules/cloud_run/main.tf`)

```hcl
resource "google_cloud_run_v2_service" "service" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image

      resources {
        limits = {
          memory = var.memory
          cpu    = var.cpu
        }
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secrets
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value.secret_id
              version = env.value.version
            }
          }
        }
      }

      startup_probe {
        http_get { path = "/healthz" }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 3
      }

      liveness_probe {
        http_get { path = "/healthz" }
        period_seconds    = 30
        failure_threshold = 3
      }
    }

    timeout = "60s"
    max_instance_request_concurrency = 80
  }
}
```

### Cloud Run Services Configuration (All Environments)

| Service | Image | Min (dev/stg/prod) | Max (all) | Memory | CPU |
|---|---|---|---|---|---|
| `storefront` | `catalog-storefront:TAG` | 0/0/1 | 10/10/20 | 512Mi | 1 |
| `admin-shell` | `catalog-admin:TAG` | 0/0/1 | 10/10/10 | 512Mi | 1 |
| `ops` | `catalog-ops:TAG` | 0/0/0 | 5/5/5 | 512Mi | 1 |
| `mfe-demo` | `catalog-mfe-demo:TAG` | 0/0/0 | 10/10/10 | 256Mi | 1 |
| `mfe-catalog` | `catalog-mfe-catalog:TAG` | 0/0/0 | 10/10/10 | 256Mi | 1 |
| `mfe-appearance` | `catalog-mfe-appearance:TAG` | 0/0/0 | 10/10/10 | 256Mi | 1 |
| `mfe-analytics` | `catalog-mfe-analytics:TAG` | 0/0/0 | 10/10/10 | 256Mi | 1 |

`ingress = INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER` for all services — traffic enters only via the Cloud Load Balancer, never directly to the Cloud Run URL.

---

## Secret Manager

All secrets provisioned by `modules/secret_manager`. Values are **never** in Terraform files — they are injected via `terraform apply -var="firebase_service_account=..."` from CI/CD using GitHub Actions secrets.

| Secret ID | Used by | Description |
|---|---|---|
| `firebase-service-account` | All server apps | Firebase Admin SDK JSON key |
| `mercadopago-access-token` | admin-shell | MP API access token |
| `mercadopago-webhook-secret` | admin-shell | MP webhook HMAC secret |
| `anthropic-api-key` | admin-shell | Claude API key for app generation |
| `gcp-storage-key` | admin-shell | Cloud Storage service account |
| `cloud-scheduler-sa-key` | scheduler | Service account for scheduler jobs |

Cloud Run services reference secrets via `secretKeyRef` — never passed as plain environment variable values.

---

## Load Balancer Path Routing

Single external IP → Cloud Load Balancer → routes by hostname:

| Host Pattern | Backend Service |
|---|---|
| `catalog.mx/*` | storefront |
| `*.catalog.mx/*` | storefront (wildcard subdomain for Pro plan) |
| `admin.catalog.mx/*` | admin-shell |
| `ops.catalog.mx/*` | ops |
| `admin.catalog.mx/_mf/demo/*` | mfe-demo |
| `admin.catalog.mx/_mf/catalog/*` | mfe-catalog |
| `admin.catalog.mx/_mf/appearance/*` | mfe-appearance |
| `admin.catalog.mx/_mf/analytics/*` | mfe-analytics |

MFE remotes are served from sub-paths of `admin.catalog.mx` in production (not separate domains) to avoid CORS complexity with Module Federation manifests.

---

## CI/CD Pipelines

All workflows live in `.github/workflows/`. They use `google-github-actions/auth` with Workload Identity Federation (no service account key files in GitHub secrets — only the Workload Identity Provider resource name).

### 1. `ci.yml` — On PR to `develop`

```
Trigger: pull_request → develop
Steps:
  1. Checkout
  2. Setup pnpm + Node 20
  3. Install dependencies (pnpm install --frozen-lockfile)
  4. pnpm typecheck
  5. pnpm lint
  6. pnpm test (Vitest, all packages)
  7. Start Firebase Emulator
  8. pnpm test:integration (Vitest with emulator)
  9. Upload coverage to Codecov
```

Concurrency group: `ci-${{ github.ref }}` with `cancel-in-progress: true` — cancels stale runs on new push.

### 2. `deploy-dev.yml` — On push to `develop`

```
Trigger: push → develop
Needs: ci.yml passes (via workflow_run or same job)
Steps:
  1. Checkout
  2. Authenticate to GCP (Workload Identity)
  3. Configure Docker for Artifact Registry
  4. Build all Docker images (matrix: storefront, admin, ops, mfe-*)
     - Each image tagged: ${{ env.REGISTRY }}/catalog-${{ matrix.service }}:${{ github.sha }}
  5. Push images to Artifact Registry
  6. For each Cloud Run service:
     gcloud run services update $SERVICE \
       --image $IMAGE_TAG \
       --region us-central1 \
       --project $DEV_PROJECT_ID \
       --traffic=100
  7. Run smoke tests (curl /healthz for each service)
  8. Notify Slack #dev-deploys channel
```

### 3. `deploy-stg.yml` — On push to `release/*`

```
Trigger: push → release/*
Steps:
  1-5: Same as deploy-dev but targeting stg project
  6. Deploy to stg Cloud Run (100% traffic)
  7. Wait for services healthy (poll /healthz, timeout 5min)
  8. Run Playwright E2E test suite against stg URLs
  9. Run smoke tests
  10. If E2E fails: rollback (redeploy previous image tag from PREVIOUS_SHA)
  11. Notify Slack #releases channel with pass/fail
```

Playwright E2E runs against `https://stg.catalog.mx` — tests are in `apps/storefront/tests/e2e/` and `apps/admin/tests/e2e/`.

### 4. `deploy-prod.yml` — On merge to `production`

```
Trigger: push → production
Requires: manual approval (GitHub environment protection: "production")
Steps:
  1. Checkout
  2. Authenticate to GCP
  3. Build + push images (same SHA as stg — no rebuild)
  4. Deploy canary (10% traffic):
     gcloud run services update-traffic $SERVICE \
       --to-revisions $NEW_REVISION=10,$OLD_REVISION=90
  5. Wait 10 minutes (monitoring canary error rate)
  6. Check canary error rate:
     - Query Cloud Monitoring API for error rate on new revision
     - If error rate > 5%: rollback (0% new revision) + notify PagerDuty critical
     - If error rate <= 5%: proceed
  7. Promote to 100%:
     gcloud run services update-traffic $SERVICE --to-latest
  8. Tag Docker image as :stable in Artifact Registry
  9. Notify Slack #prod-deploys + create GitHub release
```

### 5. `hotfix.yml` — On push to `hotfix/*`

```
Trigger: push → hotfix/*
Steps:
  1. Checkout
  2. pnpm typecheck
  3. pnpm test (unit only — no integration, no E2E)
  4. Authenticate to GCP
  5. Build + push hotfix image
  6. Deploy to prod immediately (100% traffic, no canary)
  7. Notify Slack #prod-deploys with HOTFIX label and PagerDuty incident note
  8. Open GitHub issue: "Post-hotfix: add full test coverage for [description]"
```

### Dockerfile (shared pattern for all services)

**File:** `apps/admin/Dockerfile` (already exists — others follow same pattern)

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/admin/package.json apps/admin/
RUN pnpm install --frozen-lockfile --filter @sass-factory/admin...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/admin ./apps/admin
RUN pnpm --filter @sass-factory/admin build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/admin/.output .output
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
```

---

## Environment Variables Strategy

| Environment | Source | Notes |
|---|---|---|
| Dev | `.env.development` (gitignored) | Dev Firebase project, MP sandbox |
| Staging | Secret Manager (stg project) | Separate Firebase project, MP sandbox |
| Production | Secret Manager (prod project) | Production Firebase project, MP production |

**Rule:** No secrets ever appear as plain `env` values in Terraform Cloud Run config. All secrets use `secretKeyRef`. CI/CD does not store secret values in GitHub secrets — it uses Workload Identity to access Secret Manager at deploy time.

**`apps/admin/server/utils/env.ts`** — validates required env vars on startup:
```ts
const required = [
  'FIREBASE_SERVICE_ACCOUNT',
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOPAGO_WEBHOOK_SECRET',
  'ANTHROPIC_API_KEY',
]
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`)
  }
}
```

---

## Monitoring

All monitoring resources provisioned by `modules/monitoring/main.tf`.

### Alert Policies

| Alert | Condition | Threshold | Notification |
|---|---|---|---|
| High error rate | `run.googleapis.com/request_count` with `response_code_class=5xx` / total > 1% for 5 min | >1% | PagerDuty critical |
| High latency p99 | `run.googleapis.com/request_latencies` p99 > 2000ms for 5 min | >2000ms | Slack #infra-alerts |
| Monthly budget | `billing.googleapis.com/billing/monthly_cost` > $40 | >40 USD | Email + Slack #infra-alerts |
| Daily cost spike | `billing.googleapis.com/billing/daily_cost` > $5 | >5 USD | Email info |
| Cold starts | `run.googleapis.com/container/startup_latencies` count > 10/min | >10 | Slack #infra-alerts |

### Dashboard

**File:** `infrastructure/terraform/modules/monitoring/dashboard.json` (embedded as `jsonencode` in Terraform)

Widgets:
- Request count per service (line chart)
- Error rate per service (line chart)
- Latency p50/p95/p99 per service (line chart)
- Cold start count (bar chart)
- Monthly cost vs $40 budget (gauge)
- Active Cloud Run instances per service (line chart)

### Notification Channels

```hcl
resource "google_monitoring_notification_channel" "slack_infra" {
  display_name = "Slack #infra-alerts"
  type         = "slack"
  labels = {
    channel_name = "#infra-alerts"
    auth_token   = var.slack_bot_token  # from Secret Manager
  }
}

resource "google_monitoring_notification_channel" "pagerduty" {
  display_name = "PagerDuty - catalog.mx"
  type         = "pagerduty"
  sensitive_labels {
    service_key = var.pagerduty_service_key  # from Secret Manager
  }
}
```

---

## Firestore Configuration

- Mode: Native
- Region: `nam5` (US multi-region)
- PITR (Point-in-Time Recovery): enabled (7-day retention)
- TTL policy on `businesses/{id}/clicks` collection: field `ttl` (configured via Firebase console or `google_firestore_field` resource)

**Firestore Security Rules** — file: `firestore.rules`

Key rules:
- `businesses/{id}`: read if `status == 'active'` (storefront); write only if authenticated and `request.auth.uid == resource.data.ownerId`
- `businesses/{id}/clicks/{clickId}`: create only (no read from client), no auth required
- `businesses/{id}/items/{itemId}`: read if parent `status == 'active'`; write requires owner auth
- No client can read `billing` subcollection (server-only access via Admin SDK)

---

## Custom Domain Setup

### DNS Instructions

For the wildcard subdomain (`*.catalog.mx` for Pro plan):
```
# DNS records to create at the domain registrar:
catalog.mx          A       34.x.x.x       (Cloud Load Balancer IP — from Terraform output)
*.catalog.mx        CNAME   catalog.mx.
```

The wildcard SSL certificate is managed by Certificate Manager (`google_certificate_manager_certificate` with `managed.domains = ["*.catalog.mx", "catalog.mx"]`).

### Custom Business Domains (Growth Plan)

For owners who bring their own domain (e.g., `menu.tacoselgordo.com`):

Instructions shown in the dashboard:
```
Paso 1: Ve a tu proveedor de dominio (GoDaddy, Namecheap, etc.)
Paso 2: Crea un registro CNAME:
  Nombre:  menu (o @ para el dominio raíz)
  Destino: catalog.mx
Paso 3: Espera 24-48 horas para la propagación DNS
Paso 4: Regresa aquí y haz clic en "Verificar dominio"
```

Domain verification: `GET /api/owner/domain/verify` performs a DNS lookup and checks if the CNAME points to `catalog.mx`. If verified, stores `customDomain` in the business document. SSL is provisioned via Certificate Manager DNS authorization.

---

## GDPR Compliance

### Right to Erasure

**File:** `apps/admin/server/api/v1/account.delete.ts`

Endpoint: `DELETE /api/v1/account` (requires owner auth)

Steps executed in a Firestore transaction:
1. Delete all `businesses/{id}/items/*`
2. Delete all `businesses/{id}/clicks/*`
3. Delete all `businesses/{id}/categories/*`
4. Delete `businesses/{id}`
5. Delete Firebase Auth user (`admin.auth().deleteUser(uid)`)
6. Write deletion log to `deletion_log/{uid}` (no PII — only uid, timestamp, count of deleted documents)
7. Delete logo from Cloud Storage (`gs://catalog-logos/{businessId}/`)
8. Queue confirmation email to owner's email address (before deleting the auth user, capture email first)
9. Return `204 No Content`

All steps must complete within 60 seconds. If any step fails, the transaction is rolled back and an error is returned. The owner can retry.

**SLA:** All data removed within 24 hours of request (most removals are immediate; the 24h window covers any async cleanup).

### Click Data Retention

- TTL field `ttl` on every click document = `createdAt + 90 days`.
- Firestore TTL policy on `businesses/{id}/clicks` deletes documents automatically when `ttl < now`.
- No manual job needed.

### Privacy Policy Page

**File:** `apps/storefront/app/pages/privacidad.vue`

Linked from storefront footer. Covers:
- What data is collected (clicks, business info)
- Retention periods (clicks: 90 days)
- Right to erasure (how to exercise)
- No sale of personal data
- Contact: privacidad@catalog.mx

### No PII in Logs

Enforced by code review checklist. Automated check added to `ci.yml`:
```bash
# Check for PII leaks in log statements
grep -rn "console.log.*email\|console.log.*phone\|logger.*email\|logger.*phone" \
  apps/ --include="*.ts" | grep -v "\.test\." \
  && echo "FAIL: PII in logs" && exit 1 \
  || echo "OK: No PII in logs"
```

---

## GDPR and Budget Gherkin Scenarios

### Feature: Canary Deployment

```gherkin
Feature: Canary deployment
  As the platform
  I want to gradually roll out new production deployments
  So that errors affect only a small percentage of users before full rollout

  Scenario: New production deploy sends 10% traffic to new revision
    Given a new Docker image has been built with tag "abc123"
    And the production Cloud Run service "storefront" has current revision "rev-old"
    When the deploy-prod.yml workflow runs for SHA "abc123"
    Then the new revision "rev-abc123" receives 10% of traffic
    And the old revision "rev-old" receives 90% of traffic
    And the workflow waits 10 minutes before checking error rate

  Scenario: Error rate on canary exceeds 5% and triggers automatic rollback
    Given the new revision "rev-abc123" is receiving 10% of traffic
    And the error rate on "rev-abc123" is 7.2% over the last 5 minutes
    When the deploy-prod.yml workflow checks the canary error rate
    Then the workflow sets traffic to 0% for "rev-abc123"
    And the workflow sets traffic to 100% for "rev-old"
    And a PagerDuty critical alert is fired with message "Canary rollback: error rate 7.2%"
    And the Slack #prod-deploys channel is notified with ROLLBACK label
    And the workflow exits with a failure status

  Scenario: Canary error rate is healthy and deployment proceeds
    Given the new revision "rev-abc123" is receiving 10% of traffic
    And the error rate on "rev-abc123" is 0.3% over the last 10 minutes
    When the deploy-prod.yml workflow checks the canary error rate
    Then the workflow sets 100% traffic to "rev-abc123"
    And the old revision "rev-old" is set to 0% traffic
    And the Docker image is tagged as :stable in Artifact Registry
    And a GitHub release is created for this deployment
```

### Feature: Budget Alert

```gherkin
Feature: Budget alert
  As the platform operators
  I want to be alerted when spending approaches the budget threshold
  So that we can investigate and take action before overspending

  Scenario: Monthly cost exceeds $40 and alert fires within 1 hour
    Given a Google Cloud Budget is configured with threshold $40 USD
    And the alerting threshold is set to 100% of the budget
    When the monthly GCP cost exceeds $40.00
    Then a budget alert notification fires to the configured channels
    And an email is sent to ops@catalog.mx within 1 hour
    And a Slack message is sent to #infra-alerts
    And the message contains the current spend amount and the budget threshold

  Scenario: Daily cost exceeds $5 and info alert fires
    Given a daily cost alert is configured at $5 USD
    When the daily GCP cost exceeds $5.00
    Then an info-level email notification is sent to ops@catalog.mx
    And the email subject contains "Daily cost alert: catalog.mx"
```

### Feature: GDPR Erasure

```gherkin
Feature: GDPR data erasure
  As a business owner
  I want to be able to delete my account and all associated data
  So that I can exercise my right to erasure

  Background:
    Given I am authenticated as a business owner with role "owner"
    And my business "tacos-el-gordo" has 8 items, 3 categories, 150 clicks, and a logo

  Scenario: Owner requests account deletion and all data is removed within 24h
    When I send a DELETE request to "/api/v1/account" with the Authorization header
    Then the response status is 204
    And the business document "businesses/tacos-el-gordo" does not exist in Firestore
    And all items in "businesses/tacos-el-gordo/items" are deleted
    And all clicks in "businesses/tacos-el-gordo/clicks" are deleted
    And all categories in "businesses/tacos-el-gordo/categories" are deleted
    And the logo file is deleted from Cloud Storage
    And the Firebase Auth user is deleted
    And a deletion_log entry exists with uid and timestamp (no email, no name)
    And the deletion completes within 60 seconds

  Scenario: Account deletion is confirmed via email
    Given my Firebase Auth email is "dueño@gmail.com"
    When I send a DELETE request to "/api/v1/account"
    Then before the Firebase Auth user is deleted the email address is captured
    And a confirmation email is sent to "dueño@gmail.com"
    And the email subject is "Tu cuenta en catalog.mx ha sido eliminada"
    And the email body confirms all data has been deleted

  Scenario: Owner accesses storefront after account deletion
    Given my account has been deleted
    When a customer visits "catalog.mx/tacos-el-gordo"
    Then the HTTP response status is 404
    And the 404 page is shown

  Scenario: Click data older than 90 days is automatically deleted
    Given a click document exists with ttl field set to 91 days ago
    When the Firestore TTL policy runs
    Then the click document is automatically deleted by Firestore
    And no manual job is needed for click data cleanup
```

---

## Runbooks

The following runbook files must be created as stubs with the section headers filled in. Full content is written during sprint execution based on observed behavior in staging.

### `infrastructure/runbooks/runbook-rollback.md`

Sections:
- When to use this runbook (canary error spike, critical bug in prod)
- Prerequisites (gcloud CLI, appropriate IAM role)
- Step 1: Identify the last stable revision name
  ```bash
  gcloud run revisions list --service storefront --region us-central1 --project $PROD_PROJECT
  ```
- Step 2: Roll back traffic to the stable revision
  ```bash
  gcloud run services update-traffic storefront \
    --to-revisions STABLE_REVISION=100 \
    --region us-central1 --project $PROD_PROJECT
  ```
- Step 3: Verify all services healthy (check Cloud Monitoring dashboard)
- Step 4: Notify the team in #prod-deploys Slack
- Step 5: Create a GitHub issue for the rollback with root cause analysis template

### `infrastructure/runbooks/runbook-incident-response.md`

Sections:
- Severity levels (P1: full outage, P2: partial degradation, P3: elevated errors)
- On-call rotation (defined as GitHub usernames, not personal info)
- Step 1: Acknowledge the PagerDuty alert (SLA: 5 min for P1)
- Step 2: Join #incident-{date} Slack channel (created automatically by PagerDuty integration)
- Step 3: Assess impact — how many users affected, which services down
- Step 4: Mitigation options (rollback, scale up, disable feature flag)
- Step 5: Communication template for status page update
- Step 6: Post-mortem template (blameless, within 48h of resolution)
- Contacts: GCP support console link, Firebase status page, MP status page

### `infrastructure/runbooks/runbook-cost-spike.md`

Sections:
- When this fires (daily > $5 or monthly > $40)
- Step 1: Check Cloud Monitoring cost breakdown by service
  ```bash
  # In GCP Console → Billing → Reports → Group by: Service
  ```
- Step 2: Check for unexpected Cloud Run invocations (traffic spike or abuse)
- Step 3: Check Storage egress (CDN misconfiguration or hotlinking)
- Step 4: Check Firestore reads (N+1 query bug or missing index)
- Step 5: Mitigation — enable Cloud Armor rate limiting, reduce max instances, add CDN caching headers
- Step 6: Estimated cost per service at various traffic levels (reference table)

### `infrastructure/runbooks/runbook-database-restore.md`

Sections:
- Firestore PITR (Point-in-Time Recovery) — available for last 7 days
- Step 1: Identify restore point (must be before the data loss event)
- Step 2: Export Firestore to Cloud Storage at the restore point timestamp
  ```bash
  gcloud firestore export gs://catalog-backups-prod/restore-$(date +%Y%m%d) \
    --snapshot-time "2026-05-15T10:00:00Z" \
    --project $PROD_PROJECT
  ```
- Step 3: Create a new Firestore database (do NOT restore over production until verified)
- Step 4: Import the export to the test database and verify data integrity
- Step 5: Assess impact: which collections to restore (items only? full restore?)
- Step 6: If full restore: switch Cloud Run services to maintenance mode (return 503) during restore
- Step 7: Import to production, switch off maintenance mode, verify
- Step 8: Post-mortem: what caused the data loss?

---

## File Map

```
infrastructure/
  terraform/
    modules/
      cloud_run/
        main.tf
        variables.tf
        outputs.tf
      cloud_storage/
        main.tf
        variables.tf
        outputs.tf
      secret_manager/
        main.tf
        variables.tf
        outputs.tf
      load_balancer/
        main.tf
        variables.tf
        outputs.tf
      certificate_manager/
        main.tf
        variables.tf
        outputs.tf
      monitoring/
        main.tf
        variables.tf
        outputs.tf
        dashboard.json
      budget/
        main.tf
        variables.tf
        outputs.tf
      scheduler/
        main.tf
        variables.tf
        outputs.tf
    environments/
      dev/
        main.tf
        terraform.tfvars
        backend.tf
      stg/
        main.tf
        terraform.tfvars
        backend.tf
      prod/
        main.tf
        terraform.tfvars
        backend.tf
    main.tf
    variables.tf
    outputs.tf
  runbooks/
    runbook-rollback.md
    runbook-incident-response.md
    runbook-cost-spike.md
    runbook-database-restore.md

.github/
  workflows/
    ci.yml
    deploy-dev.yml
    deploy-stg.yml
    deploy-prod.yml
    hotfix.yml

apps/admin/
  server/
    api/
      v1/
        account.delete.ts        ← GDPR erasure endpoint
      owner/
        domain/
          verify.get.ts          ← custom domain DNS verification
    utils/
      env.ts                     ← startup env var validation

apps/storefront/
  app/
    pages/
      privacidad.vue             ← privacy policy page
  server/
    middleware/
      businessStatus.ts          ← return 410 for suspended, 404 for deleted

firestore.rules                  ← updated with new collections
firestore.indexes.json           ← indexes for analytics queries

Dockerfiles (one per service, if not yet created):
  apps/storefront/Dockerfile
  apps/ops/Dockerfile
  apps/mfe/demo/Dockerfile
  apps/mfe/catalog/Dockerfile
  apps/mfe/appearance/Dockerfile
  apps/mfe/analytics/Dockerfile
```

---

## Tasks

### Terraform Agent Tasks

**Day 1 — Base + Cloud Run**
- [ ] Write failing test: Terraform plan for `modules/cloud_run` creates a `google_cloud_run_v2_service` with `ingress = INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER` (use `terraform validate` + `tftest` or `terratest`)
- [ ] Implement `modules/cloud_run/main.tf` (full config per spec above)
- [ ] Implement `modules/secret_manager/main.tf` with IAM binding for Cloud Run service accounts
- [ ] Implement `environments/dev/main.tf` calling all modules
- [ ] Run `terraform init && terraform plan` for dev — must show zero errors
- [ ] Verify output: `project_id`, `artifact_registry_url`, `cloud_run_service_urls` map

**Day 2 — Load Balancer + SSL**
- [ ] Implement `modules/load_balancer/main.tf` with path routing (7 backend services)
- [ ] Implement `modules/certificate_manager/main.tf` for `*.catalog.mx`
- [ ] Test: `terraform plan -target=module.load_balancer` shows correct URL map rules
- [ ] Implement `environments/prod/main.tf` with all modules

**Day 3 — Cloud Storage + Budget + Scheduler**
- [ ] Implement `modules/cloud_storage/main.tf` with CDN backend + lifecycle 365d
- [ ] Implement `modules/budget/main.tf` with $40 threshold
- [ ] Implement `modules/scheduler/main.tf` for daily referral rewards job
- [ ] Run `terraform plan` for stg and prod environments — zero errors

**Day 4 — Firestore + Security Rules**
- [ ] Write Firestore security rules in `firestore.rules` (see rules spec above)
- [ ] Test rules with Firebase Emulator: owner can write own items, cannot write others' items, click create is allowed unauthenticated
- [ ] Write `firestore.indexes.json` for:
  - `businesses/{id}/clicks` filtered by `createdAt` range (for analytics daily query)
  - `businesses` filtered by `status` ordered by `createdAt desc` (for superadmin list)
- [ ] Implement GDPR erasure endpoint `apps/admin/server/api/v1/account.delete.ts`
- [ ] Write failing test: DELETE `/api/v1/account` deletes all 5 subcollections + auth user + logo
- [ ] Implement deletion in a Firestore batched write (max 500 ops per batch)

**Day 5 — Privacy + Domain**
- [ ] Implement `apps/storefront/app/pages/privacidad.vue`
- [ ] Implement `apps/admin/server/api/owner/domain/verify.get.ts` (DNS lookup via `node:dns/promises`)
- [ ] Add PII log check to `ci.yml`: grep for `console.log.*email` etc.
- [ ] Run full `terraform apply` against dev environment and verify all services are accessible
- [ ] Tag all Terraform resources with `environment`, `managed_by = "terraform"`, `project = "catalog-mx"`

### CI/CD Agent Tasks

**Day 1 — CI Pipeline**
- [ ] Implement `.github/workflows/ci.yml` with full test matrix
- [ ] Configure Firebase Emulator in CI (use `firebase-tools` GitHub Action)
- [ ] Set up Codecov integration (add `CODECOV_TOKEN` to GitHub secrets)
- [ ] Add PII log grep check to CI

**Day 2 — Dev + Stg Deploy**
- [ ] Implement `.github/workflows/deploy-dev.yml` with Docker matrix build
- [ ] Configure Artifact Registry repo in GCP and add `WORKLOAD_IDENTITY_PROVIDER` to GitHub secrets
- [ ] Implement `.github/workflows/deploy-stg.yml` with Playwright E2E step
- [ ] Configure GitHub environment `staging` (no approval required)

**Day 3 — Prod Deploy + Hotfix**
- [ ] Implement `.github/workflows/deploy-prod.yml` with canary logic
- [ ] Configure GitHub environment `production` with required reviewers (minimum 1)
- [ ] Implement canary error rate check using Cloud Monitoring API (`gcloud monitoring read`)
- [ ] Implement `.github/workflows/hotfix.yml`

**Day 4 — Dockerfiles**
- [ ] Create `apps/storefront/Dockerfile` (same pattern as `apps/admin/Dockerfile`)
- [ ] Create `apps/ops/Dockerfile`
- [ ] Create `apps/mfe/demo/Dockerfile`, `apps/mfe/catalog/Dockerfile`, `apps/mfe/appearance/Dockerfile`, `apps/mfe/analytics/Dockerfile`
- [ ] Add `.dockerignore` to each app (exclude `node_modules`, `.nuxt`, `tests/`)
- [ ] Verify each image builds and `node .output/server/index.mjs` starts without errors

**Day 5 — Smoke Tests**
- [ ] Write smoke test script `infrastructure/scripts/smoke-test.mjs`:
  ```js
  // Checks /healthz for each service URL
  // Checks storefront returns 200 for a known business slug
  // Checks admin shell returns 200 on /login
  ```
- [ ] Integrate smoke test in `deploy-dev.yml` and `deploy-stg.yml`

### Monitoring Agent Tasks (start Day 2)

- [ ] Implement `modules/monitoring/main.tf` with all 5 alert policies
- [ ] Implement `modules/monitoring/dashboard.json` with 6 widgets
- [ ] Configure Slack notification channel (`#infra-alerts`)
- [ ] Configure PagerDuty notification channel
- [ ] Write failing test: alert policy for error rate > 1% has correct threshold (use `terraform plan` output validation)
- [ ] Apply monitoring module to dev environment and verify dashboard appears in Cloud Console
- [ ] Implement budget alert via `modules/budget/main.tf`
- [ ] Document: add Slack webhook URL and PagerDuty service key to Secret Manager (manual step, documented in `infrastructure/runbooks/runbook-incident-response.md`)
- [ ] Write runbook stubs: all 4 runbooks with sections filled as specified above

---

## Definition of Done

- [ ] All Gherkin scenarios pass (Playwright E2E for canary, unit tests for GDPR)
- [ ] `terraform plan` for prod environment shows zero unexpected changes (no drift)
- [ ] All 7 Cloud Run services deployed and healthy in production (`/healthz` returns 200)
- [ ] Budget alert tested: manually set threshold to $0.01, verify alert fires, restore to $40
- [ ] GDPR erasure endpoint tested: full integration test against Firestore Emulator — all 5 collections + auth + storage deleted
- [ ] GDPR test: DELETE twice on same account returns 404 on second call (idempotent)
- [ ] Canary deployment tested in stg: deploy with known-bad image → confirm rollback triggers at >5% error rate
- [ ] PII log check in CI passes (grep for email/phone in log statements returns empty)
- [ ] Firestore security rules tested with Firebase Emulator (owner can't write another owner's items)
- [ ] Custom domain verification endpoint returns correct DNS check result
- [ ] Privacy policy page accessible at `catalog.mx/privacidad` (Playwright test)
- [ ] All Dockerfiles build without errors in CI (matrix build)
- [ ] Smoke tests pass against stg environment
- [ ] All Terraform resources tagged with `environment`, `managed_by`, `project`
- [ ] Secret Manager: all production secrets created (no plaintext values in Terraform state — use `sensitive = true`)
- [ ] Runbooks: all 4 created with sections filled (not stubs)
- [ ] MR description: Terraform plan output for prod (attached as file, not inline), screenshot of Cloud Monitoring dashboard, screenshot of budget alert policy

---

## MR Template

```markdown
## Sprint 8 — Infra Producción

### Changes
- [ ] Terraform modules (cloud_run, cloud_storage, secret_manager, load_balancer, certificate_manager, monitoring, budget, scheduler)
- [ ] 3 environments (dev, stg, prod)
- [ ] 5 GitHub Actions workflows (ci, deploy-dev, deploy-stg, deploy-prod, hotfix)
- [ ] 7 Dockerfiles (all services)
- [ ] GDPR erasure endpoint
- [ ] Firestore security rules + indexes
- [ ] Privacy policy page
- [ ] Custom domain verification
- [ ] 4 runbooks

### Evidence
- [ ] Terraform plan for prod (attach `terraform_plan_prod.txt`)
- [ ] Cloud Monitoring dashboard screenshot
- [ ] Budget alert policy screenshot
- [ ] Canary rollback test result (attach CI run link)
- [ ] GDPR erasure integration test output

### Security
- [ ] All secrets in Secret Manager (no plain env vars in Terraform)
- [ ] Cloud Run ingress = internal-and-cloud-load-balancing (not public)
- [ ] Firestore rules: unauthenticated users cannot read business private data
- [ ] Webhook signature verified (not skipped in any code path)
- [ ] PII log grep in CI passes

### Checklist
- [ ] `terraform validate` passes for all 3 environments
- [ ] `terraform plan` shows no unexpected changes for prod
- [ ] All `/healthz` endpoints return 200 in prod
- [ ] Budget alert fires at $0.01 (test confirmed, restored to $40)
- [ ] GDPR: all 5 data locations deleted on account delete
- [ ] Runbooks: all 4 complete (not stubs)
- [ ] No secrets committed to git
- [ ] Target branch: `develop`
```
