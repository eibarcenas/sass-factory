from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.db import get_db

router = APIRouter(tags=["businesses"])

VALID_TRANSITIONS: dict[str, list[str]] = {
    "draft":    ["demo", "archived"],
    "demo":     ["sent", "archived"],
    "sent":     ["accepted", "rejected", "expired"],
    "accepted": ["active", "archived"],
    "active":   ["suspended", "archived"],
    "suspended":["active", "archived"],
    "expired":  ["archived"],
    "rejected": ["archived"],
    "archived": [],
}

ACTION_TO_STATUS = {
    "publish": "demo", "send": "sent", "accept": "accepted",
    "activate": "active", "suspend": "suspended",
    "reactivate": "active", "archive": "archived",
}

COLL = "businesses"

def _doc_to_dict(doc) -> dict:
    d = doc.to_dict() or {}
    d["id"] = doc.id
    # Fetch items subcollection inline
    items = [
        {**i.to_dict(), "id": i.id}
        for i in doc.reference.collection("items").order_by("order").stream()
    ]
    d["items"] = items
    return d

@router.get("/admin/businesses")
def list_businesses(status: str | None = None):
    db = get_db()
    q = db.collection(COLL)
    if status:
        q = q.where("status", "==", status)
    businesses = [_doc_to_dict(doc) for doc in q.stream()]
    return {"businesses": businesses, "total": len(businesses)}

# ── Item CRUD (specific routes BEFORE /{action}) ───────────────────────────────

@router.get("/admin/businesses/{id}/items")
def list_items(id: str):
    db = get_db()
    ref = db.collection(COLL).document(id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Business '{id}' not found")
    items = [
        {**i.to_dict(), "id": i.id}
        for i in ref.collection("items").order_by("order").stream()
    ]
    return {"items": items}

@router.post("/admin/businesses/{id}/items")
def add_item(id: str, item: dict):
    db = get_db()
    ref = db.collection(COLL).document(id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Business '{id}' not found")
    items_ref = ref.collection("items")
    count = len(list(items_ref.stream()))
    now = datetime.now(timezone.utc).isoformat()
    new_item = {
        "businessId": id,
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

@router.patch("/admin/businesses/{id}/items/{item_id}")
def update_item(id: str, item_id: str, patch: dict):
    db = get_db()
    item_ref = db.collection(COLL).document(id).collection("items").document(item_id)
    if not item_ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")
    now = datetime.now(timezone.utc).isoformat()
    allowed = {k: v for k, v in patch.items() if k in ("name", "price", "description", "visible", "order")}
    allowed["updatedAt"] = now
    item_ref.update(allowed)
    db.collection(COLL).document(id).update({"updatedAt": now})
    return {**item_ref.get().to_dict(), "id": item_id}

@router.delete("/admin/businesses/{id}/items/{item_id}")
def delete_item(id: str, item_id: str):
    db = get_db()
    item_ref = db.collection(COLL).document(id).collection("items").document(item_id)
    if not item_ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")
    item_ref.delete()
    db.collection(COLL).document(id).update({"updatedAt": datetime.now(timezone.utc).isoformat()})
    return {"deleted": item_id}

# ── Business lifecycle action ──────────────────────────────────────────────────

@router.post("/admin/businesses/{id}/{action}")
def business_action(id: str, action: str):
    db = get_db()
    ref = db.collection(COLL).document(id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Business '{id}' not found")
    business = doc.to_dict()
    new_status = ACTION_TO_STATUS.get(action)
    if not new_status:
        raise HTTPException(status_code=400, detail=f"Unknown action '{action}'")
    allowed = VALID_TRANSITIONS.get(business.get("status", ""), [])
    if new_status not in allowed:
        raise HTTPException(status_code=422,
            detail=f"Cannot transition from '{business.get('status')}' to '{new_status}'")
    now = datetime.now(timezone.utc).isoformat()
    ref.update({"status": new_status, "updatedAt": now})
    return {**business, "id": id, "status": new_status, "updatedAt": now}

# ── Owner endpoints (business owner managing their own catalog) ─────────────

@router.patch("/owner/business")
def owner_update_business(id_or_slug: str | None = None, patch: dict = {}):
    """Owner updates their own business tagline/theme.
    In production: id comes from request.state.user.business_id via RBAC.
    TODO: add Depends(require_role(Role.OWNER)) and use user.business_id.
    """
    db = get_db()
    # For now accept slug as query param (production: from JWT claims)
    slug = id_or_slug or "heladeria-el-pinguino"
    ref = db.collection("businesses").document(slug)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")
    now = datetime.now(timezone.utc).isoformat()
    allowed = {k: v for k, v in patch.items() if k in ("tagline", "theme", "name")}
    allowed["updatedAt"] = now
    ref.update(allowed)
    return {"updated": True, "slug": slug, **allowed}
