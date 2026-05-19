variable "name"            { type = string }
variable "project_id"      { type = string }
variable "region"          { type = string }
variable "image"           { type = string }
variable "service_account" { type = string }
variable "env_vars"        { type = map(string); default = {} }
variable "secrets"         { type = map(string); default = {} }
variable "min_instances"   { type = number; default = 0 }
variable "max_instances"   { type = number; default = 10 }
variable "memory"          { type = string; default = "512Mi" }
variable "cpu"             { type = string; default = "1" }
variable "concurrency"     { type = number; default = 80 }
variable "timeout_seconds" { type = number; default = 60 }

resource "google_cloud_run_v2_service" "this" {
  name     = var.name
  location = var.region
  project  = var.project_id

  template {
    service_account = var.service_account

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
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      startup_probe {
        http_get { path = "/api/health" }
        initial_delay_seconds = 5
        period_seconds        = 3
        failure_threshold     = 5
      }

      liveness_probe {
        http_get { path = "/api/health" }
        period_seconds    = 30
        failure_threshold = 3
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.this.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "url" { value = google_cloud_run_v2_service.this.uri }
output "name" { value = google_cloud_run_v2_service.this.name }
