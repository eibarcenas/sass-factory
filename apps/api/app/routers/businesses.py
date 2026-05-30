from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from factory_auth import require_role, Role, UserContext
from app.services import item_service, business_service

def require_owner_or_admin():
    return require_role(Role.SUPER_ADMIN, Role.OWNER)

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
def list_businesses(status: str | None = None):
    return business_service.list_businesses(status)


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
    return business_service.transition_status(id, action)

# ── Owner endpoints ────────────────────────────────────────────────────────────

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
