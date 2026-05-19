from fastapi import APIRouter

router = APIRouter(tags=["businesses"])

# TODO Sprint 2: implement with Firestore
MOCK_BUSINESSES = [
    {
        "id": "heladeria-pinguino",
        "slug": "heladeria-pinguino",
        "name": "Heladería El Pingüino",
        "type": "heladeria",
        "status": "demo",
        "city": "Monterrey",
    }
]

@router.get("/admin/businesses")
def list_businesses(status: str | None = None):
    results = MOCK_BUSINESSES
    if status:
        results = [b for b in results if b["status"] == status]
    return {"businesses": results, "total": len(results)}
