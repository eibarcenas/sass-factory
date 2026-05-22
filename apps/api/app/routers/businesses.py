from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.db import get_db
from app.models.enums import BusinessStatus
from app.shared.auth.rbac import require_role, require_owner_or_admin
from app.shared.auth.jwt_models import Role, UserContext

router = APIRouter(tags=["businesses"])

VALID_TRANSITIONS: dict[BusinessStatus, list[BusinessStatus]] = {
    BusinessStatus.DRAFT:     [BusinessStatus.DEMO,      BusinessStatus.ARCHIVED],
    BusinessStatus.DEMO:      [BusinessStatus.SENT,      BusinessStatus.ARCHIVED],
    BusinessStatus.SENT:      [BusinessStatus.ACCEPTED,  BusinessStatus.REJECTED, BusinessStatus.EXPIRED],
    BusinessStatus.ACCEPTED:  [BusinessStatus.ACTIVE,    BusinessStatus.ARCHIVED],
    BusinessStatus.ACTIVE:    [BusinessStatus.SUSPENDED, BusinessStatus.ARCHIVED],
    BusinessStatus.SUSPENDED: [BusinessStatus.ACTIVE,    BusinessStatus.ARCHIVED],
    BusinessStatus.EXPIRED:   [BusinessStatus.ARCHIVED],
    BusinessStatus.REJECTED:  [BusinessStatus.ARCHIVED],
    BusinessStatus.ARCHIVED:  [],
}

ACTION_TO_STATUS: dict[str, BusinessStatus] = {
    "publish":    BusinessStatus.DEMO,
    "send":       BusinessStatus.SENT,
    "accept":     BusinessStatus.ACCEPTED,
    "activate":   BusinessStatus.ACTIVE,
    "suspend":    BusinessStatus.SUSPENDED,
    "reactivate": BusinessStatus.ACTIVE,
    "archive":    BusinessStatus.ARCHIVED,
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
def owner_update_business(
    patch: dict,
    user: Annotated[UserContext, Depends(require_role(Role.OWNER))],
):
    db = get_db()
    slug = user.business_id
    if not slug:
        raise HTTPException(status_code=403, detail="No business associated with this account")
    ref = db.collection("businesses").document(slug)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")
    now = datetime.now(timezone.utc).isoformat()
    allowed = {k: v for k, v in patch.items() if k in ("tagline", "theme", "name")}
    allowed["updatedAt"] = now
    ref.update(allowed)
    return {"updated": True, "slug": slug, **allowed}


@router.get("/owner/business/items")
def owner_list_items(
    user: Annotated[UserContext, Depends(require_role(Role.OWNER))],
):
    db = get_db()
    slug = user.business_id
    if not slug:
        raise HTTPException(status_code=403, detail="No business associated with this account")
    items = [
        {**i.to_dict(), "id": i.id}
        for i in db.collection(COLL).document(slug).collection("items").order_by("order").stream()
    ]
    return {"items": items}


@router.post("/owner/business/items")
def owner_add_item(
    item: dict,
    user: Annotated[UserContext, Depends(require_role(Role.OWNER))],
):
    db = get_db()
    slug = user.business_id
    if not slug:
        raise HTTPException(status_code=403, detail="No business associated with this account")
    ref = db.collection(COLL).document(slug)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")
    items_ref = ref.collection("items")
    count = len(list(items_ref.stream()))
    now = datetime.now(timezone.utc).isoformat()
    new_item = {
        "businessId": slug,
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


@router.patch("/owner/business/items/{item_id}")
def owner_update_item(
    item_id: str,
    patch: dict,
    user: Annotated[UserContext, Depends(require_role(Role.OWNER))],
):
    db = get_db()
    slug = user.business_id
    if not slug:
        raise HTTPException(status_code=403, detail="No business associated with this account")
    item_ref = db.collection(COLL).document(slug).collection("items").document(item_id)
    if not item_ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")
    now = datetime.now(timezone.utc).isoformat()
    allowed = {k: v for k, v in patch.items() if k in ("name", "price", "description", "visible", "order")}
    allowed["updatedAt"] = now
    item_ref.update(allowed)
    db.collection(COLL).document(slug).update({"updatedAt": now})
    return {**item_ref.get().to_dict(), "id": item_id}


@router.delete("/owner/business/items/{item_id}")
def owner_delete_item(
    item_id: str,
    user: Annotated[UserContext, Depends(require_role(Role.OWNER))],
):
    db = get_db()
    slug = user.business_id
    if not slug:
        raise HTTPException(status_code=403, detail="No business associated with this account")
    item_ref = db.collection(COLL).document(slug).collection("items").document(item_id)
    if not item_ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")
    item_ref.delete()
    db.collection(COLL).document(slug).update({"updatedAt": datetime.now(timezone.utc).isoformat()})
    return {"deleted": item_id}
