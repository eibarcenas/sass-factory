from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import secrets
from pydantic import BaseModel, field_validator
from app.db import get_db
from app.domain.business import BusinessStatus, slugify
from factory_auth import get_current_user, UserContext

router = APIRouter(tags=["auth"])


def get_firebase_app():
    import firebase_admin

    if firebase_admin._apps:
        return firebase_admin.get_app()

    import os

    project_id = os.getenv(
        "FIREBASE_AUTH_PROJECT_ID",
        os.getenv("FIRESTORE_PROJECT_ID"),
    )
    signer_service_account = os.getenv(
        "FIREBASE_TOKEN_SIGNER_SERVICE_ACCOUNT",
        f"catalog-mx-api@{project_id}.iam.gserviceaccount.com",
    )
    return firebase_admin.initialize_app(options={
        "projectId": project_id,
        "serviceAccountId": signer_service_account,
    })


@router.post("/auth/claims/resolve")
def resolve_claims(
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """
    Called by the frontend immediately after Google Sign-in when the user
    has no role claim yet. Checks pending_owners/{email} in Firestore and,
    if found, sets Firebase custom claims on the current UID so the next
    token refresh returns the correct role.

    The frontend must call getIdToken(true) after a { resolved: true }
    response to pick up the new claims.
    """
    if not user.email:
        raise HTTPException(status_code=400, detail="No email on token")

    db = get_db()

    # Primary: pending_owners (manual admin activation flow)
    pending_ref = db.collection("pending_owners").document(user.email)
    pending_doc = pending_ref.get()

    if pending_doc.exists:
        data = pending_doc.to_dict()
        business_id = data.get("businessId")
        role = data.get("role", "OWNER")
        modules = data.get("modules", ["CATALOG", "APPEARANCE"])
        resolve_pending_ref = pending_ref
    else:
        # Fallback: businesses created via auto-provision (ownerEmail match)
        biz_docs = (
            db.collection("businesses")
            .where("ownerEmail", "==", user.email)
            .limit(1)
            .get()
        )
        if not biz_docs:
            return {"resolved": False, "role": user.role}

        biz = biz_docs[0].to_dict()

        # Require UID match — prevents takeover if a Firebase account is
        # deleted and a new account is created with the same email.
        if biz.get("ownerUid") != user.firebase_uid:
            return {"resolved": False, "role": user.role}

        # Only grant claims for active-ish statuses; suspended/rejected/archived
        # owners must not be able to reactivate themselves via this endpoint.
        claimable_statuses = {
            BusinessStatus.DRAFT,
            BusinessStatus.PENDING_REVIEW,
            BusinessStatus.REVIEW,
            BusinessStatus.ACTIVE,
        }
        if biz.get("status") not in claimable_statuses:
            raise HTTPException(status_code=403, detail="Account not eligible for activation")

        business_id = biz.get("slug")
        role = "OWNER"
        modules = ["CATALOG", "APPEARANCE"]
        resolve_pending_ref = None

    try:
        from firebase_admin import auth as fa

        fa.set_custom_user_claims(user.firebase_uid, {
            "role": role,
            "business_id": business_id,
            "modules": modules,
        }, app=get_firebase_app())

        if resolve_pending_ref:
            resolve_pending_ref.update({"resolvedAt": datetime.now(timezone.utc).isoformat(), "resolvedUid": user.firebase_uid})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set claims: {e}")

    return {"resolved": True, "role": role, "businessId": business_id}


# ── Self-service registration (v2) ────────────────────────────────────────────

@router.get("/business-slugs/{slug}/availability")
def check_slug(slug: str):
    """Public — returns whether a business name slug is available."""
    normalized_slug = slugify(slug)
    if not normalized_slug:
        return {"available": False, "slug": "", "reason": "invalid_name"}
    db = get_db()
    exists = db.collection("businesses").document(normalized_slug).get().exists
    return {"available": not exists, "slug": normalized_slug}


class BusinessRegistrationRequest(BaseModel):
    businessName: str
    type: str | None = None
    whatsapp: str | None = None
    city: str | None = None
    state: str | None = None
    tagline: str | None = None
    contactName: str | None = None

    @field_validator("businessName")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("businessName cannot be empty")
        return v.strip()


@router.post("/business-registrations")
def create_business_registration(
    body: BusinessRegistrationRequest,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """
    Called after landing authentication during business onboarding.
    Creates a DRAFT business and sets OWNER claims in one step so the user
    lands directly in the seller workspace without waiting for manual activation.
    """
    if not user.email:
        raise HTTPException(status_code=400, detail="No email on token")
    if user.role:
        raise HTTPException(status_code=409, detail="Account already active")

    slug = slugify(body.businessName)
    if not slug:
        raise HTTPException(status_code=400, detail="Could not derive a valid slug from that name")

    db = get_db()
    biz_ref = db.collection("businesses").document(slug)
    if biz_ref.get().exists:
        raise HTTPException(status_code=409, detail="Business name already taken")

    now = datetime.now(timezone.utc).isoformat()
    biz_ref.set({
        "name": body.businessName,
        "slug": slug,
        "status": BusinessStatus.REVIEW,
        "ownerEmail": user.email,
        "ownerUid": user.firebase_uid,
        "type": body.type,
        "whatsapp": body.whatsapp,
        "city": body.city,
        "state": body.state,
        "tagline": body.tagline,
        "contactName": body.contactName,
        "createdAt": now,
        "updatedAt": now,
    })

    try:
        from firebase_admin import auth as fa

        fa.set_custom_user_claims(user.firebase_uid, {
            "role": "OWNER",
            "business_id": slug,
            "modules": ["CATALOG", "APPEARANCE"],
        }, app=get_firebase_app())
    except Exception as e:
        biz_ref.delete()
        raise HTTPException(status_code=500, detail=f"Failed to set claims: {e}")

    return {"provisioned": True, "slug": slug, "businessName": body.businessName}


@router.post("/auth/exchanges")
def create_exchange(
    user: Annotated[UserContext, Depends(get_current_user)],
):
    code = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=2)
    get_db().collection("auth_exchanges").document(code).set({
        "uid": user.firebase_uid,
        "expiresAt": expires_at,
        "consumedAt": None,
    })
    return {"code": code, "expiresAt": expires_at.isoformat()}


@router.post("/auth/exchanges/{code}/consume")
def consume_exchange(code: str):
    db = get_db()
    ref = db.collection("auth_exchanges").document(code)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Exchange not found")

    data = doc.to_dict()
    expires_at = data.get("expiresAt")
    if data.get("consumedAt") or not expires_at or expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Exchange expired")

    try:
        from firebase_admin import auth as firebase_auth

        custom_token = firebase_auth.create_custom_token(
            data["uid"],
            app=get_firebase_app(),
        ).decode("utf-8")
        ref.update({"consumedAt": datetime.now(timezone.utc)})
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to create custom token: {error}")

    return {"customToken": custom_token}
