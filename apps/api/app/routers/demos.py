from fastapi import APIRouter
from pydantic import BaseModel
from app.services import demo_service

router = APIRouter(tags=["demos"])


class CreateDemoRequest(BaseModel):
    name: str
    type: str
    whatsapp: str
    city: str
    tagline: str | None = None


class CreateOwnerRequest(BaseModel):
    email: str
    businessId: str


class AcceptDemoRequest(BaseModel):
    email: str
    name: str | None = None


@router.post("/admin/demos")
def create_demo(body: CreateDemoRequest):
    return demo_service.create_demo(body.name, body.type, body.whatsapp, body.city, body.tagline)


@router.post("/admin/owners")
def activate_owner(body: CreateOwnerRequest):
    return demo_service.activate_owner(body.email, body.businessId)


@router.post("/demos/{slug}/accept")
def accept_demo(slug: str, body: AcceptDemoRequest):
    return demo_service.accept_demo(slug, body.email, body.name)
