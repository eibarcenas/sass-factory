from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from factory_auth import require_role, Role, UserContext
from app.services import item_service, business_service
from app.db import get_db

def require_super_admin():
    return require_role(Role.SUPER_ADMIN)

def require_owner_or_admin():
    return require_role(Role.SUPER_ADMIN, Role.OWNER)

def require_owner():
    return require_role(Role.OWNER)

router = APIRouter(tags=["businesses"])


def _resolve_owner_slug(user: UserContext, business: str | None) -> str:
    # OWNER → slug comes from JWT claims. SUPER_ADMIN → requires ?business=<slug>.
    if user.is_owner:
        if not user.business_id:
            raise HTTPException(status_code=403, detail="No business associated with this account")
        return user.business_id
    if not business:
        raise HTTPException(status_code=400, detail="SUPER_ADMIN must provide ?business=<slug>")
    return business


@router.get("/admin/businesses")
def list_businesses(
    status: str | None = None,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    return business_service.list_businesses(status)


# ── Item CRUD — admin (specific routes BEFORE /{action}) ──────────────────────

@router.get("/admin/businesses/{id}/items")
def list_items(
    id: str,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    return {"items": item_service.list_items(id)}

@router.post("/admin/businesses/{id}/items")
def add_item(
    id: str,
    item: dict,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    return item_service.add_item(id, item)

@router.patch("/admin/businesses/{id}/items/{item_id}")
def update_item(
    id: str,
    item_id: str,
    patch: dict,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    return item_service.update_item(id, item_id, patch)

@router.delete("/admin/businesses/{id}/items/{item_id}")
def delete_item(
    id: str,
    item_id: str,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    return item_service.delete_item(id, item_id)

# ── Business lifecycle action ──────────────────────────────────────────────────

@router.post("/admin/businesses/{id}/{action}")
def business_action(
    id: str,
    action: str,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    return business_service.transition_status(id, action)

# ── Owner endpoints ────────────────────────────────────────────────────────────

@router.post("/owner/business/submit")
def owner_submit_for_review(
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    """Owner submits their draft catalog for admin review (DRAFT → REVIEW)."""
    slug = _resolve_owner_slug(user, business)
    return business_service.transition_status(slug, "submit")


@router.patch("/owner/business/approve")
def owner_approve_business(
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    return business_service.owner_approve(slug)


@router.patch("/owner/business")
def owner_update_business(
    patch: dict,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    return business_service.update_business_fields(slug, patch)


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


@router.delete("/owner/account")
def owner_delete_account(
    user: Annotated[UserContext, Depends(require_owner())] = None,
):
    """Owner permanently deletes their account and business catalog."""
    if not user.business_id:
        raise HTTPException(status_code=400, detail="No business associated with this account")

    db = get_db()

    items_ref = db.collection("businesses").document(user.business_id).collection("items")
    for doc in items_ref.stream():
        doc.reference.delete()

    db.collection("businesses").document(user.business_id).delete()

    try:
        import firebase_admin
        from firebase_admin import auth as fa
        if not firebase_admin._apps:
            get_db()
        fa.delete_user(user.firebase_uid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete Firebase user: {e}")

    return {"deleted": True}
