output "project_id" {
  value = google_project.app.project_id
}

output "cloud_run_url" {
  value = "https://${var.app_slug}-${replace(google_project.app.project_id, "-", "")}.${var.region}.run.app"
}

output "hosting_url" {
  value = "https://${var.project_id}.web.app"
}

output "artifact_registry" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/apps"
}
