resource "google_project" "app" {
  name            = var.display_name
  project_id      = var.project_id
  org_id          = var.org_id
  billing_account = var.billing_account

  labels = {
    managed_by = "sass-factory"
    app_slug   = var.app_slug
  }
}

locals {
  apis = [
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each           = toset(local.apis)
  project            = google_project.app.project_id
  service            = each.value
  disable_on_destroy = false
  depends_on         = [google_project.app]
}

resource "google_artifact_registry_repository" "apps" {
  project       = google_project.app.project_id
  location      = var.region
  repository_id = "apps"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

resource "google_service_account" "cloudrun_sa" {
  project      = google_project.app.project_id
  account_id   = "cloudrun-${var.app_slug}"
  display_name = "Cloud Run SA for ${var.display_name}"
  depends_on   = [google_project_service.apis]
}

resource "google_project_iam_member" "cloudrun_firestore" {
  project = google_project.app.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# Cloud Run service (placeholder — deployed by Cloud Build step)
resource "google_cloud_run_v2_service" "app" {
  project  = google_project.app.project_id
  name     = var.app_slug
  location = var.region

  template {
    service_account = google_service_account.cloudrun_sa.email
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/apps/template:latest"
      env {
        name  = "APP_SLUG"
        value = var.app_slug
      }
    }
  }

  depends_on = [
    google_artifact_registry_repository.apps,
    google_project_service.apis,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = google_project.app.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
