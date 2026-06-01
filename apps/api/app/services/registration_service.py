"""Registration use cases — stores self-service signup requests."""
from datetime import datetime, timezone
from fastapi import HTTPException
from app.db import get_db

COLL = "registration_requests"


def create_registration(
    uid: str,
    email: str,
    business_name: str,
    business_type: str,
    owner_name: str | None,
    phone: str | None,
) -> dict:
    db = get_db()
    ref = db.collection(COLL).document(uid)

    if ref.get().exists:
        raise HTTPException(status_code=409, detail="Registration request already submitted")

    now = datetime.now(timezone.utc).isoformat()
    data = {
        "uid": uid,
        "email": email,
        "businessName": business_name,
        "businessType": business_type,
        "ownerName": owner_name,
        "phone": phone,
        "status": "pending",
        "createdAt": now,
    }
    ref.set(data)
    return {"registered": True}


def get_registration(uid: str) -> dict | None:
    db = get_db()
    doc = db.collection(COLL).document(uid).get()
    if not doc.exists:
        return None
    return {**doc.to_dict(), "id": doc.id}
