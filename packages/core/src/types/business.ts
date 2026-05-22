export enum BusinessStatus {
  Draft     = 'draft',
  Demo      = 'demo',
  Sent      = 'sent',
  Accepted  = 'accepted',
  Active    = 'active',
  Suspended = 'suspended',
  Expired   = 'expired',
  Rejected  = 'rejected',
  Archived  = 'archived',
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
  [BusinessStatus.Draft]:     [BusinessStatus.Demo,      BusinessStatus.Archived],
  [BusinessStatus.Demo]:      [BusinessStatus.Sent,      BusinessStatus.Archived],
  [BusinessStatus.Sent]:      [BusinessStatus.Accepted,  BusinessStatus.Rejected, BusinessStatus.Expired],
  [BusinessStatus.Accepted]:  [BusinessStatus.Active,    BusinessStatus.Archived],
  [BusinessStatus.Active]:    [BusinessStatus.Suspended, BusinessStatus.Archived],
  [BusinessStatus.Suspended]: [BusinessStatus.Active,    BusinessStatus.Archived],
  [BusinessStatus.Expired]:   [BusinessStatus.Archived],
  [BusinessStatus.Rejected]:  [BusinessStatus.Archived],
  [BusinessStatus.Archived]:  [],
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
