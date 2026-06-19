"""Legal documents configuration — doc types, limits, and AI generation prompts."""
import html
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


# ── Template fallback (no API key, or AI unavailable) ─────────────────────────
# Produces a sensible HTML draft from the business data + description, so the
# "Generate with AI" button always returns a usable starting document.

def _biz_label(business: dict) -> str:
    return html.escape(business.get("name") or "el negocio")


def _location_clause(business: dict) -> str:
    city = (business.get("city") or "").strip()
    return f" ubicado en {html.escape(city)}" if city else ""


def _description_note(description: str) -> str:
    text = (description or "").strip()
    if not text:
        return ""
    return f"<p><em>Información proporcionada por el negocio:</em> {html.escape(text)}</p>"


def build_terms_template(business: dict, description: str) -> str:
    name = _biz_label(business)
    location = _location_clause(business)
    return (
        f"<h2>1. Aceptación de los términos</h2>"
        f"<p>Al acceder y utilizar el catálogo digital de {name}{location}, "
        f"aceptas los presentes Términos y Condiciones. Si no estás de acuerdo, "
        f"te pedimos no utilizar el catálogo.</p>"
        f"{_description_note(description)}"
        f"<h2>2. Productos y precios</h2>"
        f"<p>Los productos y precios mostrados son informativos y pueden cambiar "
        f"sin previo aviso. La disponibilidad está sujeta a existencias.</p>"
        f"<h2>3. Pedidos y pagos</h2>"
        f"<p>Los pedidos se gestionan a través de WhatsApp. Las formas de pago "
        f"aceptadas se confirman al momento de realizar el pedido.</p>"
        f"<h2>4. Entregas</h2>"
        f"<p>Las condiciones de entrega o recolección se acuerdan directamente "
        f"con el negocio por WhatsApp.</p>"
        f"<h2>5. Cambios y devoluciones</h2>"
        f"<p>Cualquier cambio o devolución estará sujeto a la naturaleza del "
        f"producto y a lo acordado con el negocio.</p>"
        f"<h2>6. Contacto</h2>"
        f"<p>Para dudas sobre estos términos, contáctanos por WhatsApp.</p>"
    )


def build_privacy_template(business: dict, description: str) -> str:
    name = _biz_label(business)
    location = _location_clause(business)
    return (
        f"<h2>1. Responsable del tratamiento</h2>"
        f"<p>{name}{location} es responsable del tratamiento de los datos "
        f"personales que nos proporcionas.</p>"
        f"{_description_note(description)}"
        f"<h2>2. Datos que recabamos</h2>"
        f"<p>Recabamos los datos que compartes al realizar un pedido, como tu "
        f"nombre y número de teléfono (WhatsApp).</p>"
        f"<h2>3. Finalidad</h2>"
        f"<p>Usamos tus datos exclusivamente para procesar y dar seguimiento a tu "
        f"pedido y para comunicarnos contigo sobre el mismo.</p>"
        f"<h2>4. Compartir datos</h2>"
        f"<p>No compartimos tus datos con terceros, salvo cuando sea necesario "
        f"para completar tu pedido o cuando la ley lo requiera.</p>"
        f"<h2>5. Derechos ARCO</h2>"
        f"<p>Puedes solicitar el acceso, rectificación, cancelación u oposición al "
        f"tratamiento de tus datos contactándonos por WhatsApp.</p>"
        f"<h2>6. Contacto</h2>"
        f"<p>Para ejercer tus derechos o resolver dudas, contáctanos por WhatsApp.</p>"
    )


def build_template_document(doc_type: str, business: dict, description: str) -> str:
    """Deterministic HTML draft used when AI generation is unavailable."""
    if doc_type == PRIVACY:
        return build_privacy_template(business, description)
    return build_terms_template(business, description)
