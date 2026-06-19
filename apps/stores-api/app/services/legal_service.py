"""Legal document generation.

Uses the Anthropic Claude API when ANTHROPIC_API_KEY is set; otherwise (or if the
API call fails) falls back to a deterministic template so the feature works with
and without an API key — generation is never a hard blocker.
"""
import os

import anthropic

from app.application.errors import BadRequestError
from app.config.legal import (
    LEGAL_LLM_MODEL,
    LEGAL_LLM_MAX_TOKENS,
    LEGAL_SYSTEM_PROMPT,
    build_generation_prompt,
    build_template_document,
)


def generate_legal_document(doc_type: str, business: dict, description: str) -> str:
    """Generate the HTML body for one legal document.

    Returns AI-generated HTML when available, else a template-based draft.
    Raises BadRequestError only when the business description is empty.
    """
    if not description or not description.strip():
        raise BadRequestError("La descripción del negocio es obligatoria")

    # No API key → template fallback (feature still fully usable).
    if not os.getenv("ANTHROPIC_API_KEY"):
        return build_template_document(doc_type, business, description)

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
    except anthropic.APIError:
        # Upstream failure → degrade gracefully to the template.
        return build_template_document(doc_type, business, description)

    # Skip thinking blocks; concatenate the text output.
    html = "".join(
        block.text for block in message.content if block.type == "text"
    ).strip()

    return html or build_template_document(doc_type, business, description)
