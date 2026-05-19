import { defineEventHandler, getQuery } from 'h3'
import type { Business } from '@sass-factory/core'

// Mock data — Sprint 5 replaces with real Firestore
const MOCK_BUSINESSES: Business[] = [
  {
    id: 'heladeria-pinguino',
    slug: 'heladeria-pinguino',
    name: 'Heladería El Pingüino',
    type: 'heladeria',
    whatsapp: '+521234567890',
    city: 'Monterrey',
    tagline: 'La mejor heladería artesanal',
    theme: { primary: '#06b6d4', secondary: '#cffafe', accent: '#f59e0b', background: '#f0fdfe', font: 'Quicksand', emoji: '🍦', gradient: ['#06b6d4', '#0891b2'] },
    status: 'demo',
    plan: 'free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'barber-king',
    slug: 'barber-king',
    name: 'Barber King',
    type: 'barberia',
    whatsapp: '+529876543210',
    city: 'CDMX',
    tagline: 'El mejor corte de la ciudad',
    theme: { primary: '#1f2937', secondary: '#6b7280', accent: '#f59e0b', background: '#f9fafb', font: 'Oswald', emoji: '💈', gradient: ['#1f2937', '#374151'] },
    status: 'sent',
    plan: 'free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'studio-glow',
    slug: 'studio-glow',
    name: 'Studio Glow',
    type: 'estetica',
    whatsapp: '+521112223333',
    city: 'Guadalajara',
    tagline: 'Tu belleza, nuestra pasión',
    theme: { primary: '#db2777', secondary: '#fbcfe8', accent: '#f59e0b', background: '#fdf2f8', font: 'Cormorant Garamond', emoji: '💅', gradient: ['#db2777', '#ec4899'] },
    status: 'active',
    plan: 'pro',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export default defineEventHandler(async (event) => {
  await requireAuth(event, { requiredRole: 'admin' })
  const { status, page = '1', limit = '20' } = getQuery(event)

  let businesses = [...MOCK_BUSINESSES]
  if (status) {
    businesses = businesses.filter((b) => b.status === status)
  }

  return {
    businesses,
    total: businesses.length,
    page: Number(page),
    limit: Number(limit),
  }
})
