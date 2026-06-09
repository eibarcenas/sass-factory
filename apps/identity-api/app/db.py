"""Firestore and Firebase Admin clients — single instances shared across all routers."""
import os
from functools import lru_cache
import google.auth
from google.cloud import firestore
from google.auth import impersonated_credentials
from dotenv import load_dotenv

load_dotenv()


def get_firebase_app():
    """Return the named Firebase Admin app used for Auth operations (token signing, user management).

    Uses a named app 'identity-token-signer' so it never conflicts with any default app.
    Always pass app=get_firebase_app() to firebase_admin.auth calls.
    """
    import firebase_admin

    app_name = "identity-token-signer"
    try:
        return firebase_admin.get_app(app_name)
    except ValueError:
        pass

    project_id = os.getenv("FIREBASE_AUTH_PROJECT_ID", os.getenv("FIRESTORE_PROJECT_ID"))
    signer_service_account = os.getenv(
        "FIREBASE_TOKEN_SIGNER_SERVICE_ACCOUNT",
        f"catalog-mx-api@{project_id}.iam.gserviceaccount.com",
    )
    return firebase_admin.initialize_app(
        options={"projectId": project_id, "serviceAccountId": signer_service_account},
        name=app_name,
    )


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
