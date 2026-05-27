from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.db import get_db
from app.models.enums import BusinessStatus

router = APIRouter(tags=["storefront"])

@router.get("/storefront/{slug}")
def get_storefront(slug: str):
    db = get_db()
    doc = db.collection("businesses").document(slug).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")

    business = doc.to_dict()
    business["id"] = doc.id

    if business.get("status") == BusinessStatus.SUSPENDED:
        raise HTTPException(status_code=410, detail="This business is currently suspended")

    # Fetch items sorted by order, filter visible in Python (no composite index needed)
    all_items = [
        {**i.to_dict(), "id": i.id}
        for i in doc.reference.collection("items").order_by("order").stream()
    ]
    business["items"] = [i for i in all_items if i.get("visible", True)]

    return business

@router.post("/storefront/{slug}/whatsapp-click")
def record_whatsapp_click(slug: str):
    """Fire-and-forget click counter. Called from storefront on every WhatsApp CTA tap."""
    try:
        db = get_db()
        biz_ref = db.collection("businesses").document(slug)
        doc = biz_ref.get()
        if not doc.exists:
            return {"ok": False}
        current = doc.to_dict().get("whatsappClicks", 0)
        biz_ref.update({
            "whatsappClicks": current + 1,
            "lastWhatsappClickAt": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        pass
    return {"ok": True}
