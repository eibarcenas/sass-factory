from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.application.use_cases import prospects as prospect_use_cases

router = APIRouter(tags=["prospects"])


class ProspectRequest(BaseModel):
    businessId: str
    contactName: str | None = None
    phone: str | None = None
    email: str | None = None


@router.post("/prospects")
def create_prospect(body: ProspectRequest):
    try:
        return prospect_use_cases.create_prospect(body.businessId, body.contactName, body.phone, body.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/platform/prospects")
def list_prospects(businessId: str | None = None):
    return prospect_use_cases.list_prospects(businessId)
