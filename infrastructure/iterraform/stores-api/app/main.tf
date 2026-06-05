module "catalog_api" {
  source          = "../../modules/cloud_run"
  name            = "catalog-mx-stores-api"
  project_id      = var.project_id
  region          = var.region
  image           = var.image
  service_account = var.runtime_sa_email
  min_instances   = var.min_instances
  max_instances   = 5
  memory          = "512Mi"
  env_vars = {
    FIRESTORE_PROJECT_ID = var.project_id
    PUBSUB_PROJECT_ID    = var.project_id
    GCS_BUCKET           = var.images_bucket
    ENVIRONMENT          = var.environment
    CORS_ALLOWED_ORIGINS = "*"
  }
}
