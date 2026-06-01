from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from pydantic import BaseModel, field_validator
from app.db import get_db
from app.services import registration_service
from app.domain.business import BusinessType
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
