# Terraform — GCP Reusable Modules

## Module Structure

Each module is self-contained: `main.tf`, `variables.tf`, `outputs.tf`, `README.md`.
Environments instantiate modules with different variables — never duplicate resources.

```
infrastructure/
├── modules/
│   └── gcp/
│       ├── firestore/           ← database + PITR + backup schedule
│       ├── app_hosting/         ← Firebase App Hosting backend config
│       ├── cloud_run_worker/    ← Cloud Run + Eventarc triggers (apps/workers)
│       ├── cloud_storage/       ← bucket + CORS + lifecycle + CDN
│       ├── secret_manager/      ← secrets + IAM bindings
│       ├── iam/                 ← service accounts + role bindings
│       ├── monitoring/          ← uptime checks + alert policies
│       └── budget/              ← billing budget + notifications
└── environments/
    ├── dev/main.tf
    └── prod/main.tf
```

## modules/gcp/firestore

```hcl
# variables.tf
variable "project_id"   { type = string }
variable "location"     { type = string; default = "nam5" }
variable "database_id"  { type = string; default = "(default)" }
variable "enable_pitr"  { type = bool;   default = true }
variable "backup_retention_days" { type = number; default = 30 }

# main.tf
resource "google_firestore_database" "db" {
  project     = var.project_id
  name        = var.database_id
  location_id = var.location
  type        = "FIRESTORE_NATIVE"

  point_in_time_recovery_enablement = var.enable_pitr ? "POINT_IN_TIME_RECOVERY_ENABLED" : "POINT_IN_TIME_RECOVERY_DISABLED"
  delete_protection_state           = "DELETE_PROTECTION_ENABLED"
}

resource "google_firestore_backup_schedule" "daily" {
  project  = var.project_id
  database = google_firestore_database.db.name
  daily_recurrence {}
  retention = "${var.backup_retention_days * 24}h0m0s"
}

# outputs.tf
output "database_name" { value = google_firestore_database.db.name }
output "database_id"   { value = google_firestore_database.db.id }
```

## modules/gcp/cloud_storage

```hcl
variable "project_id"   { type = string }
variable "bucket_name"  { type = string }
variable "location"     { type = string; default = "US" }
variable "allowed_origins"          { type = list(string) }
variable "lifecycle_delete_days"    { type = number; default = 90 }

resource "google_storage_bucket" "bucket" {
  project  = var.project_id
  name     = var.bucket_name
  location = var.location

  uniform_bucket_level_access = true
  public_access_prevention    = "inherited"

  cors {
    origin          = var.allowed_origins
    method          = ["GET", "PUT", "POST"]
    response_header = ["Content-Type", "Content-MD5"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition { age = var.lifecycle_delete_days }
    action    { type = "Delete" }
  }

  versioning { enabled = true }
}

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"   # images are publicly readable
}
```

## modules/gcp/secret_manager

```hcl
variable "project_id" { type = string }
variable "secrets" {
  type      = map(string)   # { secret_name = secret_value }
  sensitive = true
}
variable "accessor_service_accounts" {
  type    = list(string)
  default = []
}

resource "google_secret_manager_secret" "secret" {
  for_each  = var.secrets
  project   = var.project_id
  secret_id = each.key
  replication { auto {} }
}

resource "google_secret_manager_secret_version" "version" {
  for_each    = var.secrets
  secret      = google_secret_manager_secret.secret[each.key].id
  secret_data = each.value
}

resource "google_secret_manager_secret_iam_member" "accessor" {
  for_each = {
    for pair in setproduct(keys(var.secrets), var.accessor_service_accounts) :
    "${pair[0]}-${pair[1]}" => { secret = pair[0], sa = pair[1] }
  }
  project   = var.project_id
  secret_id = google_secret_manager_secret.secret[each.value.secret].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${each.value.sa}"
}
```

## modules/gcp/cloud_run_worker

```hcl
# Cloud Run service + Eventarc triggers for apps/workers

resource "google_cloud_run_v2_service" "workers" {
  name     = "${var.prefix}-workers"
  location = var.region

  template {
    service_account = google_service_account.workers.email
    containers {
      image = var.workers_image
      env { name = "MEDIA_BUCKET"; value = var.media_bucket }
    }
  }
}

# Trigger 1: Cloud Storage → image_processor
resource "google_eventarc_trigger" "image_upload" {
  name     = "${var.prefix}-image-upload"
  location = var.region

  matching_criteria { attribute = "type";   value = "google.cloud.storage.object.v1.finalized" }
  matching_criteria { attribute = "bucket"; value = var.media_bucket }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.workers.name
      region  = var.region
      path    = "/workers/event"
    }
  }
  service_account = google_service_account.eventarc_invoker.email
}

# Trigger 2: Firestore delete → cascade_delete
resource "google_eventarc_trigger" "business_delete" {
  name     = "${var.prefix}-business-delete"
  location = var.region

  matching_criteria { attribute = "type";     value    = "google.cloud.firestore.document.v1.deleted" }
  matching_criteria { attribute = "document"; operator = "match-path-pattern"
                      value = "projects/*/databases/(default)/documents/businesses/{businessId}" }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.workers.name
      region  = var.region
      path    = "/workers/event"
    }
  }
  service_account = google_service_account.eventarc_invoker.email
}

# Trigger 3: Cloud Scheduler → clicks_cleanup (cron)
resource "google_cloud_scheduler_job" "clicks_cleanup" {
  name      = "${var.prefix}-clicks-cleanup"
  schedule  = "0 3 * * *"
  time_zone = "America/Mexico_City"

  http_target {
    uri         = "${google_cloud_run_v2_service.workers.uri}/workers/event"
    http_method = "POST"
    headers     = { "Content-Type" = "application/cloudevents+json" }

    body = base64encode(jsonencode({
      specversion     = "1.0"
      type            = "com.sass-factory.clicks.cleanup.run"
      source          = "//cloudscheduler.googleapis.com"
      id              = "cron-clicks-cleanup"
      datacontenttype = "application/json"
      data            = { jobName = "clicks-cleanup" }
    }))

    oidc_token { service_account_email = google_service_account.eventarc_invoker.email }
  }
}

resource "google_service_account" "workers" {
  account_id   = "${var.prefix}-workers"
  display_name = "Cloud Run Workers SA"
}

resource "google_service_account" "eventarc_invoker" {
  account_id   = "${var.prefix}-eventarc"
  display_name = "Eventarc Invoker SA"
}

resource "google_cloud_run_v2_service_iam_member" "eventarc_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.workers.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.eventarc_invoker.email}"
}
```

## modules/gcp/monitoring

```hcl
resource "google_monitoring_uptime_check_config" "storefront" {
  project      = var.project_id
  display_name = "Storefront Uptime"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/healthz"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type   = "uptime_url"
    labels = { host = var.storefront_url }
  }
}

# Alert: error rate > 1% in 5 minutes
resource "google_monitoring_alert_policy" "error_rate" {
  project      = var.project_id
  display_name = "High Error Rate"
  combiner     = "OR"

  conditions {
    display_name = "Error rate > 1%"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.01
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = var.notification_channels
  alert_strategy { auto_close = "1800s" }
}
```

## modules/gcp/budget

```hcl
resource "google_billing_budget" "budget" {
  billing_account = var.billing_account_id
  display_name    = "${var.project_id} Monthly Budget"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(var.monthly_limit_usd)
    }
  }

  threshold_rules { threshold_percent = 0.5  }  # 50% → warning
  threshold_rules { threshold_percent = 1.0  }  # 100% → critical

  all_updates_rule {
    pubsub_topic = google_pubsub_topic.budget_alerts.id
  }
}
```

## environments/prod/main.tf

```hcl
terraform {
  required_version = ">= 1.7"
  required_providers {
    google = { source = "hashicorp/google"; version = "~> 5.0" }
  }
  backend "gcs" {
    bucket = "sass-factory-prod-tfstate"
    prefix = "prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "firestore" {
  source                = "../../modules/gcp/firestore"
  project_id            = var.project_id
  enable_pitr           = true
  backup_retention_days = 30
}

module "storage" {
  source                = "../../modules/gcp/cloud_storage"
  project_id            = var.project_id
  bucket_name           = "${var.project_id}-business-assets"
  allowed_origins       = ["https://${var.storefront_domain}"]
  lifecycle_delete_days = 90
}

module "secrets" {
  source      = "../../modules/gcp/secret_manager"
  project_id  = var.project_id
  secrets = {
    "firebase-web-api-key"   = var.firebase_web_api_key
    "firebase-admin-sdk-key" = var.firebase_admin_sdk_key
    "ga4-measurement-id"     = var.ga4_measurement_id
  }
  accessor_service_accounts = [
    module.iam.storefront_sa_email,
    module.iam.dashboard_sa_email,
    module.iam.api_sa_email,
  ]
}

module "workers" {
  source        = "../../modules/gcp/cloud_run_worker"
  project_id    = var.project_id
  region        = var.region
  prefix        = "sass-factory-prod"
  workers_image = var.workers_image
  media_bucket  = module.storage.bucket_name
}

module "monitoring" {
  source                = "../../modules/gcp/monitoring"
  project_id            = var.project_id
  storefront_url        = var.storefront_domain
  dashboard_url         = var.dashboard_domain
  notification_channels = var.pagerduty_channel_ids
}

module "budget" {
  source             = "../../modules/gcp/budget"
  project_id         = var.project_id
  billing_account_id = var.billing_account_id
  monthly_limit_usd  = 20
  alert_emails       = var.ops_emails
}
```
