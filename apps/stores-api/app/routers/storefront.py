from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.db import get_db
from app.domain.business import BusinessStatus
from app.application.errors import ApplicationError
from app.application.use_cases import legal as legal_use_cases
from app.presentation.http.errors import raise_http

router = APIRouter(tags=["stores"])


@router.get("/stores/{slug}/legal/{doc_type}")
def get_public_legal_doc(slug: str, doc_type: str):
    """Public read of a published legal document (Términos / Aviso de Privacidad)."""
    try:
        return legal_use_cases.get_public_legal_doc(slug, doc_type)
    except ApplicationError as error:
        raise_http(error)

@router.get("/stores/{slug}")
def get_store(slug: str, review: bool = False):
    """
    Public catalog endpoint.
    - store=true  → bypass status gate (used by /store/{slug} preview route)
    - store=false → only serve ACTIVE businesses; anything else returns 403
    """
    db = get_db()
    doc = db.collection("businesses").document(slug).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")

    business = doc.to_dict()
    business["id"] = doc.id
    status = business.get("status")

    if not review and status != BusinessStatus.ACTIVE:
        raise HTTPException(
            status_code=403,
            detail={"code": "inactive", "name": business.get("name", "")},
        )

    # Fetch items sorted by order, filter visible in Python (no composite index needed)
    all_items = [
        {**i.to_dict(), "id": i.id}
        for i in doc.reference.collection("items").order_by("order").stream()
    ]
    business["items"] = [i for i in all_items if i.get("visible", True)]

    return business

@router.post("/stores/{slug}/whatsapp-clicks")
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
