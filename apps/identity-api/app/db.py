"""Firestore client — single instance shared across all routers."""
import os
from functools import lru_cache
import google.auth
from google.cloud import firestore
from google.auth import impersonated_credentials
from dotenv import load_dotenv

load_dotenv()

@lru_cache(maxsize=1)
def get_db() -> firestore.Client:
    project = os.getenv("FIRESTORE_PROJECT_ID")
    impersonate_service_account = os.getenv("GOOGLE_IMPERSONATE_SERVICE_ACCOUNT")

    if impersonate_service_account:
        source_credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        credentials = impersonated_credentials.Credentials(
            source_credentials=source_credentials,
            target_principal=impersonate_service_account,
            target_scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        return firestore.Client(project=project, credentials=credentials)

    return firestore.Client(project=project)
