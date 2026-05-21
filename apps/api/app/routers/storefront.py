from fastapi import APIRouter, HTTPException
from app.db import get_db
from app.models.enums import BusinessStatus

router = APIRouter(tags=["storefront"])

@router.get("/storefront/{slug}")
def get_storefront(slug: str):
    db = get_db()
    doc = db.collection("businesses").document(slug).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")

    business = doc.to_dict()
    business["id"] = doc.id

    if business.get("status") == BusinessStatus.SUSPENDED:
        raise HTTPException(status_code=410, detail="This business is currently suspended")

    # Fetch items sorted by order, filter visible in Python (no composite index needed)
    all_items = [
        {**i.to_dict(), "id": i.id}
        for i in doc.reference.collection("items").order_by("order").stream()
    ]
    business["items"] = [i for i in all_items if i.get("visible", True)]

    return business
