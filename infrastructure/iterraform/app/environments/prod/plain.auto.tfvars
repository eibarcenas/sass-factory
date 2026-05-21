project_id            = "ei-catalog-prod"
region                = "us-central1"
billing_account_id    = "01D723-FAA09C-E568B4"
alert_email           = "eibarcenas.m@gmail.com"
api_sa_email          = "ei-catalog-api@ei-catalog-prod.iam.gserviceaccount.com"
monitoring_channel_id = ""

# Prod: min_instances=1 to avoid cold starts
storefront_image = "us-central1-docker.pkg.dev/ei-catalog-prod/ei-catalog/catalog-mx-storefront:latest"
admin_image      = "us-central1-docker.pkg.dev/ei-catalog-prod/ei-catalog/catalog-mx-admin:latest"
api_image        = "us-central1-docker.pkg.dev/ei-catalog-prod/ei-catalog/catalog-mx-api:latest"
