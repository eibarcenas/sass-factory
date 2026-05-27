from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.db import get_db
from app.models.enums import BusinessStatus
from factory_auth import require_role, Role, UserContext

def require_owner_or_admin():
    return require_role(Role.SUPER_ADMIN, Role.OWNER)
from app.services import item_service

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

# ── Item CRUD — admin (specific routes BEFORE /{action}) ──────────────────────

@router.get("/admin/businesses/{id}/items")
def list_items(id: str):
    return {"items": item_service.list_items(id)}

@router.post("/admin/businesses/{id}/items")
def add_item(id: str, item: dict):
    return item_service.add_item(id, item)

@router.patch("/admin/businesses/{id}/items/{item_id}")
def update_item(id: str, item_id: str, patch: dict):
    return item_service.update_item(id, item_id, patch)

@router.delete("/admin/businesses/{id}/items/{item_id}")
def delete_item(id: str, item_id: str):
    return item_service.delete_item(id, item_id)

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

def _resolve_owner_slug(user: UserContext, business: str | None) -> str:
    """
    OWNER → use business_id from JWT claims (slug param ignored).
    SUPER_ADMIN + ?business=<slug> → use the provided slug.
    SUPER_ADMIN without slug → 400.
    """
    if user.is_owner:
        if not user.business_id:
            raise HTTPException(status_code=403, detail="No business associated with this account")
        return user.business_id
    if not business:
        raise HTTPException(status_code=400, detail="SUPER_ADMIN must provide ?business=<slug>")
    return business


@router.patch("/owner/business")
def owner_update_business(
    patch: dict,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    db = get_db()
    ref = db.collection("businesses").document(slug)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")
    now = datetime.now(timezone.utc).isoformat()
    allowed = {k: v for k, v in patch.items() if k in ("tagline", "theme", "name")}
    allowed["updatedAt"] = now
    ref.update(allowed)
    return {"updated": True, "slug": slug, **allowed}


# ── Item CRUD — owner ─────────────────────────────────────────────────────────

@router.get("/owner/business/items")
def owner_list_items(
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    return {"items": item_service.list_items(slug)}


@router.post("/owner/business/items")
def owner_add_item(
    item: dict,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    return item_service.add_item(slug, item)


@router.patch("/owner/business/items/{item_id}")
def owner_update_item(
    item_id: str,
    patch: dict,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    return item_service.update_item(slug, item_id, patch)


@router.delete("/owner/business/items/{item_id}")
def owner_delete_item(
    item_id: str,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    return item_service.delete_item(slug, item_id)
