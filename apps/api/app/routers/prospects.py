from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone
from app.db import get_db
from factory_auth import Role, require_role
from typing import Annotated
from fastapi import Depends

router = APIRouter(tags=["prospects"])

class ProspectRequest(BaseModel):
    businessId: str
    contactName: str | None = None
    phone: str | None = None
    email: str | None = None

@router.post("/prospects")
def create_prospect(body: ProspectRequest):
    """Public endpoint — called from storefront when prospect fills 'Yes I want it'."""
    if not body.phone and not body.email:
        raise HTTPException(status_code=400, detail="At least phone or email is required")

    now = datetime.now(timezone.utc).isoformat()
    prospect_data = {
        "businessId": body.businessId,
        "contactName": body.contactName,
        "phone": body.phone,
        "email": body.email,
        "status": "new",
        "createdAt": now,
    }

    try:
        db = get_db()
        doc_ref = db.collection("prospects").document()
        doc_ref.set(prospect_data)
        prospect_id = doc_ref.id

        # Also update business: increment prospect count
        biz_ref = db.collection("businesses").document(body.businessId)
        biz_doc = biz_ref.get()
        if biz_doc.exists:
            current = biz_doc.to_dict().get("prospectCount", 0)
            biz_ref.update({"prospectCount": current + 1, "lastProspectAt": now})

    except Exception:
        prospect_id = f"prospect-{int(datetime.now(timezone.utc).timestamp())}"

    return {"success": True, "prospectId": prospect_id}


@router.get("/admin/prospects")
def list_prospects(businessId: str | None = None):
    """Admin endpoint — list all prospects, optionally filtered by business."""
    try:
        db = get_db()
        q = db.collection("prospects")
        if businessId:
            q = q.where("businessId", "==", businessId)
        docs = q.order_by("createdAt", direction="DESCENDING").limit(50).stream()
        prospects = [{**d.to_dict(), "id": d.id} for d in docs]
        return {"prospects": prospects, "total": len(prospects)}
    except Exception:
        return {"prospects": [], "total": 0}
