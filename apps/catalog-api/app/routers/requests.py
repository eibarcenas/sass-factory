import secrets
import string
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from google.api_core.exceptions import AlreadyExists
from pydantic import BaseModel
from factory_auth import require_role, Role, UserContext

from app.db import get_db
from app.domain.request import RequestStatus

router = APIRouter(tags=["requests"])


def _require_owner_or_admin():
    return require_role(Role.SUPER_ADMIN, Role.OWNER)


def _make_hash(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


class RequestItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float | None = None
    total: float | None = None


class CreateRequestBody(BaseModel):
    hash: str | None = None
    items: list[RequestItem]
    total: float | None = None
    customer_message: str | None = None


class UpdateStatusBody(BaseModel):
    status: RequestStatus


@router.post("/storefront/{slug}/requests")
def create_request(slug: str, body: CreateRequestBody):
    db = get_db()
    biz_doc = db.collection("businesses").document(slug).get()
    if not biz_doc.exists:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")

    req_hash = body.hash or _make_hash()
    now = datetime.now(timezone.utc).isoformat()

    request_data = {
        "hash": req_hash,
        "business_id": slug,
        "storefront_slug": slug,
        "items": [item.model_dump(exclude_none=True) for item in body.items],
        "total": body.total,
        "customer_message": body.customer_message,
        "status": RequestStatus.PENDING,
        "created_at": now,
    }

    try:
        db.collection("requests").document(req_hash).create(request_data)
    except AlreadyExists:
        raise HTTPException(status_code=409, detail="Request hash already exists")
    return {"hash": req_hash, "status": RequestStatus.PENDING}


@router.get("/storefront/requests/{hash}")
def get_request(hash: str):
    db = get_db()
    doc = db.collection("requests").document(hash).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Request not found")
    return {**doc.to_dict(), "id": doc.id}


@router.patch("/owner/requests/{hash}/status")
def update_request_status(
    hash: str,
    body: UpdateStatusBody,
    user: Annotated[UserContext, Depends(_require_owner_or_admin())],
):
    db = get_db()
    doc = db.collection("requests").document(hash).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Request not found")

    req = doc.to_dict()
    business_id = req.get("business_id")

    if user.is_owner and user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Request belongs to a different business")

    doc.reference.update({"status": body.status, "updatedAt": datetime.now(timezone.utc).isoformat()})
    return {"hash": hash, "status": body.status}


@router.get("/owner/requests")
def list_requests(
    user: Annotated[UserContext, Depends(_require_owner_or_admin())],
    business: str | None = None,
):
    db = get_db()

    if user.is_owner:
        slug = user.business_id
    else:
        if not business:
            raise HTTPException(status_code=400, detail="SUPER_ADMIN must provide ?business=<slug>")
        slug = business

    docs = (
        db.collection("requests")
        .where("business_id", "==", slug)
        .order_by("created_at", direction="DESCENDING")
        .limit(100)
        .stream()
    )
    return {"requests": [{**d.to_dict(), "id": d.id} for d in docs]}
