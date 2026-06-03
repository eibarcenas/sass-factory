output "tf_state_bucket" {
  value = google_storage_bucket.tf_state.name
}

output "images_bucket" {
  value = google_storage_bucket.images.name
}

output "images_public_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.images.name}"
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "api_runtime_sa_email" {
  value       = google_service_account.api_runtime.email
  description = "Set this in app/environments/{env}/plain.auto.tfvars as api_sa_email"
}

output "deployer_sa_email" {
  value       = google_service_account.deployer.email
  description = "Set this in GitHub Actions workflow as service_account"
}

output "wif_provider" {
  value       = google_iam_workload_identity_pool_provider.github.name
  description = "Set this in GitHub Actions workflow as workload_identity_provider"
}

output "monitoring_channel_id" {
  value = google_monitoring_notification_channel.email.name
}
