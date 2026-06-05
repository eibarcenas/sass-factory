from fastapi import APIRouter
from pydantic import BaseModel
from app.application.errors import ApplicationError
from app.application.use_cases import demos as demo_use_cases
from app.presentation.http.errors import raise_http

router = APIRouter(tags=["demos"])


class CreateDemoRequest(BaseModel):
    name: str
    type: str
    whatsapp: str
    city: str
    state: str | None = None
    contact_name: str | None = None
    owner_email: str | None = None
    tagline: str | None = None
    logo: str | None = None


class CreateOwnerRequest(BaseModel):
    email: str
    businessId: str


class AcceptDemoRequest(BaseModel):
    email: str
    name: str | None = None


@router.post("/admin/demos")
def create_demo(body: CreateDemoRequest):
    return demo_use_cases.create_demo(
        body.name, body.type, body.whatsapp, body.city, body.tagline,
        state=body.state, contact_name=body.contact_name, owner_email=body.owner_email,
        logo=body.logo,
    )


@router.post("/admin/owners")
def activate_owner(body: CreateOwnerRequest):
    return demo_use_cases.activate_owner(body.email, body.businessId)


@router.post("/demos/{slug}/accept")
def accept_demo(slug: str, body: AcceptDemoRequest):
    try:
        return demo_use_cases.accept_demo(slug, body.email, body.name)
    except ApplicationError as error:
        raise_http(error)
