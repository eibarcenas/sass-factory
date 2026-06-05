from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from factory_auth import require_role, Role, UserContext
from app.application.errors import ApplicationError
from app.application.use_cases import businesses as business_use_cases
from app.application.use_cases import items as item_use_cases
from app.db import get_db
from app.presentation.http.errors import raise_http

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


@router.get("/platform/businesses")
def list_businesses(
    status: str | None = None,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    return business_use_cases.list_businesses(status)


# ── Item CRUD — admin (specific routes BEFORE /{action}) ──────────────────────

@router.get("/platform/businesses/{id}/products")
def list_items(
    id: str,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    try:
        return {"items": item_use_cases.list_items(id)}
    except ApplicationError as error:
        raise_http(error)

@router.post("/platform/businesses/{id}/products")
def add_item(
    id: str,
    item: dict,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    try:
        return item_use_cases.add_item(id, item)
    except ApplicationError as error:
        raise_http(error)

@router.patch("/platform/businesses/{id}/products/{item_id}")
def update_item(
    id: str,
    item_id: str,
    patch: dict,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    try:
        return item_use_cases.update_item(id, item_id, patch)
    except ApplicationError as error:
        raise_http(error)

@router.delete("/platform/businesses/{id}/products/{item_id}")
def delete_item(
    id: str,
    item_id: str,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    try:
        return item_use_cases.delete_item(id, item_id)
    except ApplicationError as error:
        raise_http(error)

# ── Business lifecycle action ──────────────────────────────────────────────────

@router.post("/platform/businesses/{id}/actions/{action}")
def business_action(
    id: str,
    action: str,
    _: Annotated[UserContext, Depends(require_super_admin())] = None,
):
    try:
        return business_use_cases.transition_status(id, action)
    except ApplicationError as error:
        raise_http(error)

# ── Owner endpoints ────────────────────────────────────────────────────────────

@router.patch("/seller/profile")
def owner_update_business(
    patch: dict,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    try:
        return business_use_cases.update_business_fields(slug, patch)
    except ApplicationError as error:
        raise_http(error)


# ── Item CRUD — owner ─────────────────────────────────────────────────────────

@router.get("/seller/products")
def owner_list_items(
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    try:
        return {"items": item_use_cases.list_items(slug)}
    except ApplicationError as error:
        raise_http(error)


@router.post("/seller/products")
def owner_add_item(
    item: dict,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    try:
        return item_use_cases.add_item(slug, item)
    except ApplicationError as error:
        raise_http(error)


@router.patch("/seller/products/{item_id}")
def owner_update_item(
    item_id: str,
    patch: dict,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    try:
        return item_use_cases.update_item(slug, item_id, patch)
    except ApplicationError as error:
        raise_http(error)


@router.delete("/seller/products/{item_id}")
def owner_delete_item(
    item_id: str,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    try:
        return item_use_cases.delete_item(slug, item_id)
    except ApplicationError as error:
        raise_http(error)


@router.delete("/seller/profile")
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
