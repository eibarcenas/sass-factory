export enum BusinessStatus {
  Pending  = 'pending',
  Active   = 'active',
  Inactive = 'inactive',
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
