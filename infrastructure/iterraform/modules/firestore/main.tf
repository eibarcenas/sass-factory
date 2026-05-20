# Uses a data source when the database already exists (import scenario)
# Run: terraform import module.firestore.google_firestore_database.this projects/{project}/databases/(default)
resource "google_firestore_database" "this" {
  project                           = var.project_id
  name                              = var.database_id
  location_id                       = var.location
  type                              = "FIRESTORE_NATIVE"
  concurrency_mode                  = "PESSIMISTIC"
  app_engine_integration_mode       = "DISABLED"
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_DISABLED"
  delete_protection_state           = "DELETE_PROTECTION_DISABLED"
}
