from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from pydantic import BaseModel, field_validator
from app.db import get_db
from app.domain.business import BusinessStatus, slugify
from factory_auth import get_current_user, UserContext

router = APIRouter(tags=["auth"])


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

        # Only grant claims for active-ish statuses; inactive owners
        # must not be able to reactivate themselves via this endpoint.
        claimable_statuses = {BusinessStatus.PENDING, BusinessStatus.ACTIVE}
        if biz.get("status") not in claimable_statuses:
            raise HTTPException(status_code=403, detail="Account not eligible for activation")

        business_id = biz.get("slug")
        role = "OWNER"
        modules = ["CATALOG", "APPEARANCE"]
        resolve_pending_ref = None

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

        if resolve_pending_ref:
            resolve_pending_ref.update({"resolvedAt": datetime.now(timezone.utc).isoformat(), "resolvedUid": user.firebase_uid})

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
    biz_data: dict = {
        "name": body.businessName,
        "slug": slug,
        "status": BusinessStatus.PENDING,
        "ownerEmail": user.email,
        "ownerUid": user.firebase_uid,
        "createdAt": now,
        "updatedAt": now,
    }
    if body.type:        biz_data["type"] = body.type
    if body.whatsapp:    biz_data["whatsapp"] = body.whatsapp
    if body.city:        biz_data["city"] = body.city
    if body.state:       biz_data["state"] = body.state
    if body.tagline:     biz_data["tagline"] = body.tagline
    if body.contactName: biz_data["contactName"] = body.contactName
    biz_ref.set(biz_data)

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
