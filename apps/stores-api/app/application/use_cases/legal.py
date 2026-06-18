"""Legal document use cases: read, save, and AI-generate per business."""
from datetime import datetime, timezone

from app.application.errors import BadRequestError, NotFoundError
from app.application.use_cases.businesses import get_business_or_404
from app.config.legal import CONTENT_MAX_LENGTH, LEGAL_DOC_TYPES
from app.services.legal_service import generate_legal_document


def _validate_doc_type(doc_type: str) -> None:
    if doc_type not in LEGAL_DOC_TYPES:
        raise BadRequestError(
            f"Tipo de documento inválido: '{doc_type}'. "
            f"Opciones: {', '.join(LEGAL_DOC_TYPES)}"
        )


def get_legal_docs(slug: str) -> dict:
    """Return the business legalDocs map (empty dict if none generated yet)."""
    _, business = get_business_or_404(slug)
    return {"slug": slug, "legalDocs": business.get("legalDocs") or {}}


def update_legal_doc(slug: str, doc_type: str, content: str) -> dict:
    """Persist hand-edited HTML content for one legal document."""
    _validate_doc_type(doc_type)
    if len(content) > CONTENT_MAX_LENGTH:
        raise BadRequestError(
            f"El documento excede el máximo de {CONTENT_MAX_LENGTH} caracteres"
        )

    ref, _ = get_business_or_404(slug)
    now = datetime.now(timezone.utc).isoformat()
    document = {"content": content, "updatedAt": now}
    ref.update({f"legalDocs.{doc_type}": document, "updatedAt": now})
    return {"slug": slug, "docType": doc_type, "document": document}


def generate_legal_doc(slug: str, doc_type: str, description: str) -> dict:
    """Generate one legal document with AI and persist it as the current draft."""
    _validate_doc_type(doc_type)
    _, business = get_business_or_404(slug)

    html = generate_legal_document(doc_type, business, description)

    ref, _ = get_business_or_404(slug)
    now = datetime.now(timezone.utc).isoformat()
    document = {"content": html, "updatedAt": now, "generatedAt": now}
    ref.update({f"legalDocs.{doc_type}": document, "updatedAt": now})
    return {"slug": slug, "docType": doc_type, "document": document}


def get_public_legal_doc(slug: str, doc_type: str) -> dict:
    """Public read of a single legal document. 404 if not generated yet."""
    _validate_doc_type(doc_type)
    _, business = get_business_or_404(slug)
    docs = business.get("legalDocs") or {}
    document = docs.get(doc_type)
    if not document or not (document.get("content") or "").strip():
        raise NotFoundError(f"El documento '{doc_type}' no está disponible")
    return {
        "slug": slug,
        "docType": doc_type,
        "businessName": business.get("name", ""),
        "content": document.get("content", ""),
        "updatedAt": document.get("updatedAt"),
    }
