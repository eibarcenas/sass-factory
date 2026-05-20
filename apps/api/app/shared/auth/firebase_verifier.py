import os
from functools import lru_cache

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import HTTPException

from .jwt_models import FirebaseClaims, Role


@lru_cache(maxsize=1)
def _get_firebase_app():
    if firebase_admin._apps:
        return firebase_admin.get_app()

    svc_account = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    project_id  = os.getenv("FIRESTORE_PROJECT_ID", "catalog-mx-dev")

    if svc_account and svc_account.strip():
        import json
        cred = credentials.Certificate(json.loads(svc_account))
        return firebase_admin.initialize_app(cred)
    else:
        # Application Default Credentials (Cloud Run Workload Identity)
        return firebase_admin.initialize_app(options={"projectId": project_id})


def verify_firebase_token(token: str) -> FirebaseClaims:
    app = _get_firebase_app()
    # Skip revocation check when using the Firebase emulator
    check_revoked = os.getenv("FIREBASE_AUTH_EMULATOR_HOST") is None
    try:
        decoded = firebase_auth.verify_id_token(token, app=app, check_revoked=check_revoked)
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token has been revoked")
    except firebase_auth.UserDisabledError:
        raise HTTPException(status_code=401, detail="User account is disabled")
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    role_str = decoded.get("role")
    try:
        role = Role(role_str) if role_str else None
    except ValueError:
        role = None

    return FirebaseClaims(
        uid=decoded["uid"],
        email=decoded.get("email"),
        role=role,
        modules=decoded.get("modules", []),
        business_id=decoded.get("business_id"),
    )
