import base64
import json

from fastapi import APIRouter, HTTPException, Request, status

from app.infrastructure.notifications import email_gateway

router = APIRouter(tags=["events"])


@router.post("/internal/events/{slug}")
async def receive_event(slug: str, request: Request):
    envelope = await request.json()
    if not envelope or "message" not in envelope:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Pub/Sub envelope",
        )

    pubsub_message = envelope["message"]
    encoded_data = pubsub_message.get("data")
    if not encoded_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty Pub/Sub message",
        )

    try:
        payload = json.loads(base64.b64decode(encoded_data).decode("utf-8"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Pub/Sub payload: {exc}",
        ) from exc

    if slug == "catalog-business-status-changed-v1":
        _handle_business_status_changed(payload)
    elif slug == "prospects-prospect-created-v1":
        _handle_prospect_created(payload)
    elif slug == "demos-demo-accepted-v1":
        _handle_demo_accepted(payload)

    return {"status": "acknowledged", "event": slug}


def _handle_business_status_changed(payload: dict) -> None:
    business = payload.get("business", {})
    status_value = payload.get("status")
    owner_email = business.get("ownerEmail") or payload.get("ownerEmail")
    business_name = business.get("name") or payload.get("businessName") or payload.get("businessId")
    business_id = payload.get("businessId")

    if status_value == "active" and owner_email and business_id:
        email_gateway.send_catalog_activated(owner_email, business_name, business_id)
    elif status_value in {"review", "pending_review"} and business_id:
        email_gateway.send_review_submitted(business_name, business_id, owner_email or "")


def _handle_prospect_created(payload: dict) -> None:
    email_gateway.send_prospect_created(payload)


def _handle_demo_accepted(payload: dict) -> None:
    email_gateway.send_demo_accepted(payload)
