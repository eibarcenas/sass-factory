// Inlined from @catalog-mx/core — types only, erased at build time
// Keep in sync with packages/core/src/types/

export type BusinessStatus =
  | 'draft' | 'demo' | 'sent' | 'accepted' | 'active'
  | 'suspended' | 'expired' | 'rejected' | 'archived'

export type BusinessType =
  | 'heladeria' | 'barberia' | 'estetica' | 'restaurante'
  | 'panaderia' | 'gym' | 'mecanico' | 'otro'

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
