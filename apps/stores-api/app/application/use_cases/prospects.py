"""Prospect use cases."""
from datetime import datetime, timezone
from app.db import get_db
from app.domain.prospect import validate_prospect


def create_prospect(
    business_id: str,
    contact_name: str | None,
    phone: str | None,
    email: str | None,
) -> dict:
    validate_prospect(phone, email)

    now = datetime.now(timezone.utc).isoformat()
    prospect_data = {
        "businessId": business_id,
        "contactName": contact_name,
        "phone": phone,
        "email": email,
        "status": "new",
        "createdAt": now,
    }

    try:
        db = get_db()
        doc_ref = db.collection("prospects").document()
        doc_ref.set(prospect_data)
        prospect_id = doc_ref.id

        biz_ref = db.collection("businesses").document(business_id)
        biz_doc = biz_ref.get()
        if biz_doc.exists:
            current = biz_doc.to_dict().get("prospectCount", 0)
            biz_ref.update({"prospectCount": current + 1, "lastProspectAt": now})

    except Exception:
        prospect_id = f"prospect-{int(datetime.now(timezone.utc).timestamp())}"

    return {"success": True, "prospectId": prospect_id}


def list_prospects(business_id: str | None) -> dict:
    try:
        db = get_db()
        q = db.collection("prospects")
        if business_id:
            q = q.where("businessId", "==", business_id)
        docs = q.order_by("createdAt", direction="DESCENDING").limit(50).stream()
        prospects = [{**d.to_dict(), "id": d.id} for d in docs]
        return {"prospects": prospects, "total": len(prospects)}
    except Exception:
        return {"prospects": [], "total": 0}
