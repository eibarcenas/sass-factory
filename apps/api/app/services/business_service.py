"""Business use cases — orchestrates domain rules + Firestore."""
from datetime import datetime, timezone
from fastapi import HTTPException
from app.db import get_db
from app.domain.business import resolve_new_status, BusinessStatus, OWNER_PATCH_FIELDS

COLL = "businesses"


def get_business_or_404(business_id: str) -> tuple:
    db = get_db()
    ref = db.collection(COLL).document(business_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Business '{business_id}' not found")
    return ref, doc.to_dict()


def transition_status(business_id: str, action: str) -> dict:
    ref, business = get_business_or_404(business_id)
    try:
        new_status = resolve_new_status(
            BusinessStatus(business.get("status", "")), action
        )
    except ValueError as e:
        code = 400 if "Unknown action" in str(e) else 422
        raise HTTPException(status_code=code, detail=str(e))
    now = datetime.now(timezone.utc).isoformat()
    extra = {"submittedAt": now} if new_status == BusinessStatus.PENDING_REVIEW else {}
    ref.update({"status": new_status, "updatedAt": now, **extra})
    return {**business, "id": business_id, "status": new_status, "updatedAt": now, **extra}


def update_business_fields(slug: str, patch: dict) -> dict:
    ref, _ = get_business_or_404(slug)
    now = datetime.now(timezone.utc).isoformat()
    allowed = {k: v for k, v in patch.items() if k in OWNER_PATCH_FIELDS}
    allowed["updatedAt"] = now
    ref.update(allowed)
    return {"updated": True, "slug": slug, **allowed}


def list_businesses(status: str | None) -> dict:
    db = get_db()
    q = db.collection(COLL)
    if status:
        q = q.where("status", "==", status)
    businesses = [_doc_to_dict(doc) for doc in q.stream()]
    return {"businesses": businesses, "total": len(businesses)}


def _doc_to_dict(doc) -> dict:
    d = doc.to_dict() or {}
    d["id"] = doc.id
    items = [
        {**i.to_dict(), "id": i.id}
        for i in doc.reference.collection("items").order_by("order").stream()
    ]
    d["items"] = items
    return d
