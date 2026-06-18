"""Legal document endpoints — seller (owner/admin) authenticated routes."""
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from factory_auth import UserContext

from app.application.errors import ApplicationError
from app.application.use_cases import legal as legal_use_cases
from app.config.legal import LEGAL_GENERATE_RATE_LIMIT, PROMPT_MAX_LENGTH
from app.limiter import limiter
from app.presentation.http.errors import raise_http
from app.routers.businesses import require_owner_or_admin, _resolve_owner_slug

router = APIRouter(tags=["legal"])


class UpdateLegalDocRequest(BaseModel):
    docType: str
    content: str


class GenerateLegalDocRequest(BaseModel):
    docType: str
    description: str


@router.get("/seller/legal")
def get_legal_docs(
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    try:
        return legal_use_cases.get_legal_docs(slug)
    except ApplicationError as error:
        raise_http(error)


@router.patch("/seller/legal")
def update_legal_doc(
    body: UpdateLegalDocRequest,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    try:
        return legal_use_cases.update_legal_doc(slug, body.docType, body.content)
    except ApplicationError as error:
        raise_http(error)


@router.post("/seller/legal/generate")
@limiter.limit(LEGAL_GENERATE_RATE_LIMIT)
def generate_legal_doc(
    request: Request,
    body: GenerateLegalDocRequest,
    business: str | None = None,
    user: Annotated[UserContext, Depends(require_owner_or_admin())] = None,
):
    slug = _resolve_owner_slug(user, business)
    description = (body.description or "")[:PROMPT_MAX_LENGTH]
    try:
        return legal_use_cases.generate_legal_doc(slug, body.docType, description)
    except ApplicationError as error:
        raise_http(error)
