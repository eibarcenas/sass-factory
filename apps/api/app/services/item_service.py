from datetime import datetime, timezone
from fastapi import HTTPException
from app.db import get_db

COLL = "businesses"
ALLOWED_PATCH_FIELDS = ("name", "price", "description", "visible", "order")


def list_items(business_id: str) -> list[dict]:
    db = get_db()
    ref = db.collection(COLL).document(business_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Business '{business_id}' not found")
    return [{**i.to_dict(), "id": i.id} for i in ref.collection("items").order_by("order").stream()]


def add_item(business_id: str, item: dict) -> dict:
    db = get_db()
    ref = db.collection(COLL).document(business_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Business '{business_id}' not found")
    items_ref = ref.collection("items")
    count = len(list(items_ref.stream()))
    now = datetime.now(timezone.utc).isoformat()
    new_item = {
        "businessId": business_id,
        "name": item.get("name", ""),
        "price": float(item.get("price", 0)),
        "currency": "MXN",
        "description": item.get("description"),
        "visible": item.get("visible", True),
        "order": count + 1,
        "createdAt": now,
        "updatedAt": now,
    }
    doc_ref = items_ref.document()
    doc_ref.set(new_item)
    ref.update({"updatedAt": now})
    return {**new_item, "id": doc_ref.id}


def update_item(business_id: str, item_id: str, patch: dict) -> dict:
    db = get_db()
    item_ref = db.collection(COLL).document(business_id).collection("items").document(item_id)
    if not item_ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")
    now = datetime.now(timezone.utc).isoformat()
    allowed = {k: v for k, v in patch.items() if k in ALLOWED_PATCH_FIELDS}
    allowed["updatedAt"] = now
    item_ref.update(allowed)
    db.collection(COLL).document(business_id).update({"updatedAt": now})
    return {**item_ref.get().to_dict(), "id": item_id}


def delete_item(business_id: str, item_id: str) -> dict:
    db = get_db()
    item_ref = db.collection(COLL).document(business_id).collection("items").document(item_id)
    if not item_ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")
    item_ref.delete()
    db.collection(COLL).document(business_id).update({"updatedAt": datetime.now(timezone.utc).isoformat()})
    return {"deleted": item_id}
