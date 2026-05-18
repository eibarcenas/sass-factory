export type BusinessStatus =
  | 'draft'
  | 'demo'
  | 'sent'
  | 'accepted'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'rejected'
  | 'archived'

export type BusinessType =
  | 'heladeria'
  | 'barberia'
  | 'estetica'
  | 'restaurante'
  | 'panaderia'
  | 'gym'
  | 'mecanico'
  | 'otro'

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
  logo?: string
  tagline?: string
  theme: BusinessTheme
  status: BusinessStatus
  plan: 'free' | 'pro' | 'growth'
  ownerId?: string
  domain?: string
  demoGeneratedAt?: string
  sentAt?: string
  acceptedAt?: string
  activatedAt?: string
  createdAt: string
  updatedAt: string
}

// Valid status transitions — used by validateTransition()
export const VALID_TRANSITIONS: Record<BusinessStatus, BusinessStatus[]> = {
  draft:     ['demo', 'archived'],
  demo:      ['sent', 'archived'],
  sent:      ['accepted', 'rejected', 'expired'],
  accepted:  ['active', 'archived'],
  active:    ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  expired:   ['archived'],
  rejected:  ['archived'],
  archived:  [],
}

export function validateTransition(
  from: BusinessStatus,
  to: BusinessStatus,
): { valid: true } | { valid: false; reason: string } {
  const allowed = VALID_TRANSITIONS[from]
  if (allowed.includes(to)) return { valid: true }
  return {
    valid: false,
    reason: `Cannot transition from '${from}' to '${to}'. Allowed: ${allowed.join(', ') || 'none'}`,
  }
}
