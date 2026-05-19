from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(tags=["prospects"])

class ProspectRequest(BaseModel):
    businessId: str
    contactName: str | None = None
    phone: str | None = None
    email: str | None = None

@router.post("/prospects")
def create_prospect(body: ProspectRequest):
    if not body.phone and not body.email:
        raise HTTPException(status_code=400, detail="At least phone or email is required")
    # TODO Sprint 5: write to Firestore
    return {
        "success": True,
        "prospectId": f"prospect-{int(datetime.now(timezone.utc).timestamp())}",
    }
