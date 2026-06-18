"""Legal document AI generation via the Anthropic Claude API."""
import os

import anthropic

from app.application.errors import BadRequestError, ApplicationError
from app.config.legal import (
    LEGAL_LLM_MODEL,
    LEGAL_LLM_MAX_TOKENS,
    LEGAL_SYSTEM_PROMPT,
    build_generation_prompt,
)


class LegalGenerationUnavailableError(ApplicationError):
    """Raised when AI generation can't run (missing API key or upstream failure)."""

    def __init__(self, detail: str):
        super().__init__(503, detail)


def generate_legal_document(doc_type: str, business: dict, description: str) -> str:
    """Generate the HTML body for one legal document. Returns sanitized-ish HTML text.

    Raises BadRequestError for empty input, LegalGenerationUnavailableError when the
    Anthropic API key is missing or the upstream call fails.
    """
    if not description or not description.strip():
        raise BadRequestError("La descripción del negocio es obligatoria")

    if not os.getenv("ANTHROPIC_API_KEY"):
        raise LegalGenerationUnavailableError(
            "La generación con IA no está disponible (falta ANTHROPIC_API_KEY)"
        )

    client = anthropic.Anthropic()
    user_prompt = build_generation_prompt(doc_type, business, description)

    try:
        message = client.messages.create(
            model=LEGAL_LLM_MODEL,
            max_tokens=LEGAL_LLM_MAX_TOKENS,
            thinking={"type": "adaptive"},
            system=LEGAL_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except anthropic.APIError as error:
        raise LegalGenerationUnavailableError(
            f"No se pudo generar el documento: {error}"
        ) from error

    # Skip thinking blocks; concatenate the text output.
    html = "".join(
        block.text for block in message.content if block.type == "text"
    ).strip()

    if not html:
        raise LegalGenerationUnavailableError(
            "La IA no devolvió contenido. Intenta de nuevo."
        )
    return html
