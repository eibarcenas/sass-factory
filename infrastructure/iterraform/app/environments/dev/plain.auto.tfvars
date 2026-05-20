project_id            = "catalog-mx-dev"
region                = "us-central1"
billing_account_id    = "01D723-FAA09C-E568B4"
alert_email           = "eibarcenas.m@gmail.com"

# SA created in setup/ — get from: terraform -chdir=../setup output api_runtime_sa_email
api_sa_email          = "catalog-mx-api@catalog-mx-dev.iam.gserviceaccount.com"

# Monitoring channel — get from: terraform -chdir=../setup output monitoring_channel_id
monitoring_channel_id = "projects/catalog-mx-dev/notificationChannels/9787671671709251432"

storefront_image = "us-central1-docker.pkg.dev/catalog-mx-dev/cloud-run-source-deploy/catalog-mx-storefront@sha256:e656d675949fc5b383a99f40c381d50237b00634bd68e501bd22b7836092c93f"
admin_image      = "us-central1-docker.pkg.dev/catalog-mx-dev/cloud-run-source-deploy/catalog-mx-admin@sha256:a4c18e0bc02b59c7936379b7f2b14a1e9d8c9886b94c3dd0e0f88f78edc87791"
api_image        = "us-central1-docker.pkg.dev/catalog-mx-dev/cloud-run-source-deploy/catalog-mx-api@sha256:e9c036f1d8056437e9b584af2a55ea431d7cc7b415ee7d113660f516fdb04daa"
