output "tf_state_bucket"  { value = google_storage_bucket.tf_state.name }
output "enabled_apis"     { value = keys(google_project_service.apis) }
