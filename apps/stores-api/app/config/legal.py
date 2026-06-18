"""Legal documents configuration — doc types, limits, and AI generation prompts."""
import os

# ── Document types ────────────────────────────────────────────────────────────
# Must stay in sync with LegalDocType in packages/core/src/types/business.ts.
TERMS = "terms"
PRIVACY = "privacy"
LEGAL_DOC_TYPES = (TERMS, PRIVACY)

# Human-readable Spanish titles, used in the AI prompts.
LEGAL_DOC_TITLES = {
    TERMS: "Términos y Condiciones",
    PRIVACY: "Aviso de Privacidad",
}

# ── Limits ────────────────────────────────────────────────────────────────────
# Free-text description the seller types in the "Generate with AI" modal.
PROMPT_MAX_LENGTH = 600
# Upper bound on stored HTML content per document (defensive cap).
CONTENT_MAX_LENGTH = 50_000

# ── AI generation (Anthropic) ─────────────────────────────────────────────────
# Default to the most capable model; override via env without code changes.
LEGAL_LLM_MODEL = os.getenv("LEGAL_LLM_MODEL", "claude-opus-4-8")
LEGAL_LLM_MAX_TOKENS = 8_000

# Per-business generation rate limit (slowapi string form).
LEGAL_GENERATE_RATE_LIMIT = os.getenv("LEGAL_GENERATE_RATE_LIMIT", "5/hour")

# Shared system prompt: the model returns clean HTML for a rich-text editor.
LEGAL_SYSTEM_PROMPT = (
    "Eres un asistente legal para pequeños negocios en México que venden por "
    "catálogo digital y reciben pedidos por WhatsApp. Redactas documentos legales "
    "claros, en español de México, apropiados para un negocio pequeño.\n\n"
    "Reglas de salida:\n"
    "- Devuelve ÚNICAMENTE HTML del cuerpo del documento, sin <html>, <head> ni <body>.\n"
    "- Usa solo estas etiquetas: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>.\n"
    "- No incluyas el título principal del documento (la app ya lo muestra).\n"
    "- No uses bloques de código, Markdown, ni comentarios; solo el HTML del contenido.\n"
    "- Numera las secciones y mantén un tono profesional pero accesible.\n"
    "- No inventes datos que no te dieron (direcciones, RFC, correos); si faltan, "
    "usa frases genéricas o indica que el negocio los proporcionará por WhatsApp."
)


def build_generation_prompt(doc_type: str, business: dict, description: str) -> str:
    """Build the user message for a single legal document generation."""
    title = LEGAL_DOC_TITLES[doc_type]
    name = business.get("name") or "el negocio"
    biz_type = business.get("type") or "negocio"
    city = business.get("city") or ""
    location = f" ubicado en {city}" if city else ""
    return (
        f"Redacta el documento de {title} para {name}, un negocio de tipo "
        f"'{biz_type}'{location}.\n\n"
        f"Descripción del negocio proporcionada por el dueño:\n{description.strip()}\n\n"
        f"Genera el contenido completo de {title} en HTML siguiendo las reglas indicadas."
    )
