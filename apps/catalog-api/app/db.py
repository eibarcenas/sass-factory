"""Firestore client — single instance shared across all routers."""
import os
from functools import lru_cache
from google.cloud import firestore
from dotenv import load_dotenv

load_dotenv()

@lru_cache(maxsize=1)
def get_db() -> firestore.Client:
    project = os.getenv("FIRESTORE_PROJECT_ID", "catalog-mx-dev")
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    if creds_path and os.path.exists(creds_path):
        # Explicit service account (local dev + Cloud Run with key)
        return firestore.Client(project=project)
    else:
        # Application Default Credentials (Cloud Run with Workload Identity)
        return firestore.Client(project=project)
