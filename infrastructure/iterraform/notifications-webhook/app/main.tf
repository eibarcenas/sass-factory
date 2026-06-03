data "google_project" "current" {
  project_id = var.project_id
}

module "notifications_webhook" {
  source          = "../../modules/cloud_run"
  name            = "catalog-mx-notifications-webhook"
  project_id      = var.project_id
  region          = var.region
  image           = var.image
  service_account = var.runtime_sa_email
  min_instances   = var.min_instances
  max_instances   = 5
  memory          = "512Mi"
  allow_public    = false
  env_vars = {
    FIRESTORE_PROJECT_ID = var.project_id
    ENVIRONMENT          = var.environment
    ADMIN_NOTIFY_EMAIL   = var.admin_notify_email
    SMTP_HOST            = var.smtp_host
    SMTP_PORT            = var.smtp_port
    SMTP_USER            = var.smtp_user
    SMTP_FROM            = var.smtp_from
    STOREFRONT_URL       = var.storefront_url
    ADMIN_URL            = var.admin_url
  }
  secrets = {
    SMTP_PASS = var.smtp_pass_secret
  }
}

resource "google_service_account_iam_member" "pubsub_can_mint_oidc" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.runtime_sa_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_cloud_run_v2_service_iam_member" "pubsub_invoker" {
  project  = var.project_id
  location = var.region
  name     = module.notifications_webhook.service_name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.runtime_sa_email}"
}

resource "google_pubsub_subscription" "catalog_business_status_changed_v1_to_notifications_webhook" {
  name  = "sub-catalog-business-status-changed-v1-to-notifications-webhook"
  topic = "projects/${var.project_id}/topics/topic-catalog-business-status-changed-v1"

  push_config {
    push_endpoint = "${module.notifications_webhook.url}/internal/events/catalog-business-status-changed-v1"

    oidc_token {
      service_account_email = var.runtime_sa_email
      audience              = module.notifications_webhook.url
    }
  }
}

resource "google_pubsub_subscription" "prospects_prospect_created_v1_to_notifications_webhook" {
  name  = "sub-prospects-prospect-created-v1-to-notifications-webhook"
  topic = "projects/${var.project_id}/topics/topic-prospects-prospect-created-v1"

  push_config {
    push_endpoint = "${module.notifications_webhook.url}/internal/events/prospects-prospect-created-v1"

    oidc_token {
      service_account_email = var.runtime_sa_email
      audience              = module.notifications_webhook.url
    }
  }
}

resource "google_pubsub_subscription" "demos_demo_accepted_v1_to_notifications_webhook" {
  name  = "sub-demos-demo-accepted-v1-to-notifications-webhook"
  topic = "projects/${var.project_id}/topics/topic-demos-demo-accepted-v1"

  push_config {
    push_endpoint = "${module.notifications_webhook.url}/internal/events/demos-demo-accepted-v1"

    oidc_token {
      service_account_email = var.runtime_sa_email
      audience              = module.notifications_webhook.url
    }
  }
}
