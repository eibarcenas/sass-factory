from fastapi import APIRouter
from pydantic import BaseModel
from app.application.errors import ApplicationError
from app.application.use_cases import stores as store_use_cases
from app.presentation.http.errors import raise_http

router = APIRouter(tags=["stores"])


class CreateStoreRequest(BaseModel):
    name: str
    type: str
    whatsapp: str
    city: str
    state: str | None = None
    contact_name: str | None = None
    owner_email: str | None = None
    tagline: str | None = None
    logo: str | None = None


class CreateSellerRequest(BaseModel):
    email: str
    businessId: str


class AcceptStoreRequest(BaseModel):
    email: str
    name: str | None = None


@router.post("/platform/businesses")
def create_store(body: CreateStoreRequest):
    return store_use_cases.create_store(
        body.name, body.type, body.whatsapp, body.city, body.tagline,
        state=body.state, contact_name=body.contact_name, owner_email=body.owner_email,
        logo=body.logo,
    )


@router.post("/platform/businesses/{business_id}/seller")
def activate_seller(business_id: str, body: CreateSellerRequest):
    return store_use_cases.activate_owner(body.email, business_id)


@router.post("/stores/{slug}/acceptance")
def accept_store(slug: str, body: AcceptStoreRequest):
    try:
        return store_use_cases.accept_store(slug, body.email, body.name)
    except ApplicationError as error:
        raise_http(error)
