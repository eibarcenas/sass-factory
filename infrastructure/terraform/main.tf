terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  # State stored in GCS (factory project bucket)
  backend "gcs" {
    bucket = var.state_bucket
    prefix = "terraform/apps"
  }
}

provider "google" {
  project = var.factory_project_id
  region  = var.region
}

module "app_project" {
  source          = "./modules/gcp-project"
  project_id      = var.app_project_id
  display_name    = var.app_display_name
  org_id          = var.org_id
  billing_account = var.billing_account
  region          = var.region
  app_slug        = var.app_slug
}

output "project_id"    { value = module.app_project.project_id }
output "cloud_run_url" { value = module.app_project.cloud_run_url }
output "hosting_url"   { value = module.app_project.hosting_url }
