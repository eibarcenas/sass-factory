from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import prospect_service

router = APIRouter(tags=["prospects"])


class ProspectRequest(BaseModel):
    businessId: str
    contactName: str | None = None
    phone: str | None = None
    email: str | None = None


@router.post("/prospects")
def create_prospect(body: ProspectRequest):
    try:
        return prospect_service.create_prospect(body.businessId, body.contactName, body.phone, body.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/admin/prospects")
def list_prospects(businessId: str | None = None):
    return prospect_service.list_prospects(businessId)
