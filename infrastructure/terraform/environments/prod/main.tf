terraform {
  required_version = ">= 1.7"
  required_providers {
    google = { source = "hashicorp/google"; version = "~> 5.0" }
  }
  backend "gcs" {
    bucket = "sass-factory-tf-state"
    prefix = "prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id"         { type = string }
variable "region"             { type = string; default = "us-central1" }
variable "billing_account_id" { type = string }
variable "alert_email"        { type = string }

locals {
  services = ["storefront", "admin", "ops"]
  image_tag = var.image_tag
}

variable "image_tag" { type = string; default = "latest" }

# Storefront
module "storefront" {
  source          = "../../modules/cloud_run"
  name            = "sass-factory-storefront"
  project_id      = var.project_id
  region          = var.region
  image           = "gcr.io/${var.project_id}/storefront:${var.image_tag}"
  service_account = "sass-factory-storefront@${var.project_id}.iam.gserviceaccount.com"
  min_instances   = 0
  max_instances   = 20
  memory          = "512Mi"
  secrets = {
    FIREBASE_API_KEY   = "firebase-api-key"
    FIREBASE_PROJECT_ID = "firebase-project-id"
  }
}

# Admin
module "admin" {
  source          = "../../modules/cloud_run"
  name            = "sass-factory-admin"
  project_id      = var.project_id
  region          = var.region
  image           = "gcr.io/${var.project_id}/admin:${var.image_tag}"
  service_account = "sass-factory-admin@${var.project_id}.iam.gserviceaccount.com"
  min_instances   = 0
  max_instances   = 10
  secrets = {
    ANTHROPIC_API_KEY  = "anthropic-api-key"
    FIREBASE_API_KEY   = "firebase-api-key"
    MP_ACCESS_TOKEN    = "mp-access-token"
    MP_WEBHOOK_SECRET  = "mp-webhook-secret"
  }
}

# Super Admin (ops)
module "ops" {
  source          = "../../modules/cloud_run"
  name            = "sass-factory-ops"
  project_id      = var.project_id
  region          = var.region
  image           = "gcr.io/${var.project_id}/ops:${var.image_tag}"
  service_account = "sass-factory-ops@${var.project_id}.iam.gserviceaccount.com"
  min_instances   = 0
  max_instances   = 3
}

# Monitoring
module "monitoring" {
  source      = "../../modules/monitoring"
  project_id  = var.project_id
  services    = local.services
  alert_email = var.alert_email
}

# Budget
module "budget" {
  source             = "../../modules/budget"
  project_id         = var.project_id
  billing_account_id = var.billing_account_id
  monthly_limit_usd  = 40
  alert_email        = var.alert_email
}

output "storefront_url" { value = module.storefront.url }
output "admin_url"      { value = module.admin.url }
output "ops_url"        { value = module.ops.url }
