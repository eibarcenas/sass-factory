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

    # FIREBASE_AUTH_PROJECT_ID = project that issued the tokens (Firebase Auth)
    # Separate from FIRESTORE_PROJECT_ID (where data lives)
    # In dev: tokens from catalog-mx-dev, data in ei-catalog-dev
    auth_project = os.getenv(
        "FIREBASE_AUTH_PROJECT_ID",
        os.getenv("FIRESTORE_PROJECT_ID", "catalog-mx-dev")
    )

    svc_account = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if svc_account and svc_account.strip():
        import json
        cred = credentials.Certificate(json.loads(svc_account))
        return firebase_admin.initialize_app(cred)
    else:
        return firebase_admin.initialize_app(options={"projectId": auth_project})


def verify_firebase_token(token: str) -> FirebaseClaims:
    app = _get_firebase_app()
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
