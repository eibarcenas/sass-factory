// Inlined from @catalog-mx/core — types only, erased at build time
// Keep in sync with packages/core/src/types/

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
  gradient?: [string, string]
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
  createdAt: string
  updatedAt: string
}

export interface Item {
  id: string
  businessId: string
  name: string
  price: number
  currency: 'MXN'
  description?: string
  image?: string
  category?: string
  visible: boolean
  order: number
  createdAt?: string
  updatedAt?: string
}
