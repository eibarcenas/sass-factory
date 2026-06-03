project_id       = "ei-catalog-prod"
region           = "us-central1"
runtime_sa_email = "ei-catalog-api@ei-catalog-prod.iam.gserviceaccount.com"
environment      = "production"
min_instances    = 1
image            = "us-central1-docker.pkg.dev/ei-catalog-prod/ei-catalog/catalog-mx-identity-api:latest"
