export enum BusinessStatus {
  Draft         = 'draft',
  PendingReview = 'pending_review',
  Pending       = 'pending',
  Active        = 'active',
  Inactive      = 'inactive',
}

export enum BusinessType {
  Heladeria   = 'heladeria',
  Barberia    = 'barberia',
  Estetica    = 'estetica',
  Restaurante = 'restaurante',
  Panaderia   = 'panaderia',
  Gym         = 'gym',
  Mecanico    = 'mecanico',
  Otro        = 'otro',
}

/** Legal document kinds a seller can publish on their storefront. */
export enum LegalDocType {
  Terms   = 'terms',
  Privacy = 'privacy',
}

/** A single legal document. `content` is sanitized HTML produced by the rich-text editor. */
export interface LegalDocument {
  content: string
  updatedAt: string | null
  /** Set when the content was last produced by AI generation; null/undefined if hand-written. */
  generatedAt?: string | null
}

/** Per-business legal documents, keyed by {@link LegalDocType}. */
export type LegalDocs = Partial<Record<LegalDocType, LegalDocument>>

export interface BusinessTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  font: string
  emoji: string
  gradient: [string, string]
}

export interface Business {
  id: string
  slug: string
  name: string
  type: BusinessType
  whatsapp: string
  city: string
  state?: string
  contactName?: string
  logo?: string
  tagline?: string
  legalDocs?: LegalDocs
  theme: BusinessTheme
  status: BusinessStatus
  plan: 'free' | 'pro' | 'growth'
  ownerId?: string
  domain?: string
  ownerEmail?: string
  submittedAt?: string
  ownerApprovedAt?: string
  demoGeneratedAt?: string
  sentAt?: string
  acceptedAt?: string
  activatedAt?: string
  createdAt: string
  updatedAt: string
}
