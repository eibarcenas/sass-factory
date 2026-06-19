// Legal document metadata for the public storefront.
// Keys must match LegalDocType values in packages/core and the stores-api routes.

export const LEGAL_DOC_TITLES: Record<string, string> = {
  terms: 'Términos y Condiciones',
  privacy: 'Aviso de Privacidad',
}

export const LEGAL_DOC_ORDER = ['terms', 'privacy'] as const

export function isLegalDocType(value: string): boolean {
  return value in LEGAL_DOC_TITLES
}

// Tags the rich-text editor can produce; everything else is stripped on render.
export const LEGAL_ALLOWED_TAGS = ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br']
