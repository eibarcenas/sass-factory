from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["demos"])

class CreateDemoRequest(BaseModel):
    name: str
    type: str
    whatsapp: str
    city: str
    tagline: str | None = None

@router.post("/admin/demos")
def create_demo(body: CreateDemoRequest):
    slug = (
        body.name.lower()
        .replace(" ", "-")
        .replace("á", "a").replace("é", "e").replace("í", "i")
        .replace("ó", "o").replace("ú", "u").replace("ñ", "n")
    )[:40]
    return {
        "id": slug,
        "slug": slug,
        "name": body.name,
        "type": body.type,
        "whatsapp": body.whatsapp,
        "city": body.city,
        "tagline": body.tagline,
        "status": "demo",
        "plan": "free",
    }
