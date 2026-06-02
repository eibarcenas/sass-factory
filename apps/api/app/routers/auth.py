from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from pydantic import BaseModel, field_validator
from app.db import get_db
from app.services import registration_service
from app.domain.business import BusinessType, BusinessStatus, slugify
from factory_auth import get_current_user, UserContext

router = APIRouter(tags=["auth"])


class RegisterRequest(BaseModel):
    businessName: str
    businessType: str
    ownerName: str | None = None
    phone: str | None = None

    @field_validator("businessName")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("businessName cannot be empty")
        return v.strip()

    @field_validator("businessType")
    @classmethod
    def valid_type(cls, v: str) -> str:
        valid = {t.value for t in BusinessType}
        if v not in valid:
            raise ValueError(f"businessType must be one of {sorted(valid)}")
        return v


@router.post("/auth/register")
def register(
    body: RegisterRequest,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """
    Self-service registration. Called after Google sign-in when the user
    has no role yet. Creates a registration_requests/{uid} document for
    the admin team to review and activate within 24 hours.
    """
    if not user.email:
        raise HTTPException(status_code=400, detail="No email on token")

    if user.role:
        raise HTTPException(status_code=409, detail="Account already active")

    return registration_service.create_registration(
        uid=user.firebase_uid,
        email=user.email,
        business_name=body.businessName,
        business_type=body.businessType,
        owner_name=body.ownerName,
        phone=body.phone,
    )


@router.post("/auth/resolve-claims")
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
    pending_ref = db.collection("pending_owners").document(user.email)
    pending_doc = pending_ref.get()

    if not pending_doc.exists:
        return {"resolved": False, "role": user.role}

    data = pending_doc.to_dict()
    business_id = data.get("businessId")
    role = data.get("role", "OWNER")
    modules = data.get("modules", ["CATALOG", "APPEARANCE"])

    try:
        import firebase_admin
        from firebase_admin import auth as fa

        if not firebase_admin._apps:
            get_db()

        fa.set_custom_user_claims(user.firebase_uid, {
            "role": role,
            "business_id": business_id,
            "modules": modules,
        })

        pending_ref.update({"resolvedAt": datetime.now(timezone.utc).isoformat(), "resolvedUid": user.firebase_uid})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set claims: {e}")

    return {"resolved": True, "role": role, "businessId": business_id}


# ── Self-service registration (v2) ────────────────────────────────────────────

@router.get("/auth/check-slug")
def check_slug(name: str):
    """Public — returns whether a business name slug is available."""
    if not name.strip():
        raise HTTPException(status_code=400, detail="name is required")
    slug = slugify(name)
    if not slug:
        return {"available": False, "slug": "", "reason": "invalid_name"}
    db = get_db()
    exists = db.collection("businesses").document(slug).get().exists
    return {"available": not exists, "slug": slug}


class AutoProvisionRequest(BaseModel):
    businessName: str

    @field_validator("businessName")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("businessName cannot be empty")
        return v.strip()


@router.post("/auth/auto-provision")
def auto_provision(
    body: AutoProvisionRequest,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """
    Called after Google sign-in on /register.
    Creates a DRAFT business and sets OWNER claims in one step so the user
    lands directly in their Owner Dashboard without waiting for manual activation.
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
        "createdAt": now,
        "updatedAt": now,
    })

    try:
        import firebase_admin
        from firebase_admin import auth as fa
        if not firebase_admin._apps:
            get_db()
        fa.set_custom_user_claims(user.firebase_uid, {
            "role": "OWNER",
            "business_id": slug,
            "modules": ["CATALOG", "APPEARANCE"],
        })
    except Exception as e:
        biz_ref.delete()
        raise HTTPException(status_code=500, detail=f"Failed to set claims: {e}")

    return {"provisioned": True, "slug": slug, "businessName": body.businessName}
