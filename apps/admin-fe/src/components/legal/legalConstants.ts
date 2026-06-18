import { LegalDocType } from '@eguru/core'

/** Max length of the free-text business description in the "Generate with AI" modal. */
export const LEGAL_PROMPT_MAX_LENGTH = 600

/** Tabs shown in the Legal section, in display order. */
export const LEGAL_TABS: { key: LegalDocType; label: string; storePath: string }[] = [
  { key: LegalDocType.Terms,   label: 'Términos y Condiciones', storePath: 'terms' },
  { key: LegalDocType.Privacy, label: 'Aviso de Privacidad',    storePath: 'privacy' },
]

export const LEGAL_DISCLAIMER =
  'Este texto es orientativo y no sustituye la asesoría legal profesional.'

const STORE_URL = import.meta.env.VITE_STORE_URL ?? 'http://localhost:3010'

/** Public storefront URL for a given legal document. */
export function legalStoreUrl(slug: string, storePath: string): string {
  return `${STORE_URL}/${slug}/legal/${storePath}`
}
