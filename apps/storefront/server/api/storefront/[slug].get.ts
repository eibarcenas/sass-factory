import { defineEventHandler, createError, getRouterParam } from 'h3'
import type { Business, Item } from '@sass-factory/core'

// In production this reads from Firestore
// In dev/mock mode returns hardcoded data for known slugs
const MOCK_BUSINESSES: Record<string, Business & { items: Item[] }> = {
  'heladeria-pinguino': {
    id: 'heladeria-pinguino',
    slug: 'heladeria-pinguino',
    name: 'Heladería El Pingüino',
    type: 'heladeria',
    whatsapp: '+521234567890',
    city: 'Monterrey',
    tagline: 'La mejor heladería artesanal de Monterrey 🍦',
    theme: {
      primary: '#06b6d4',
      secondary: '#cffafe',
      accent: '#f59e0b',
      background: '#f0fdfe',
      font: 'Quicksand',
      emoji: '🍦',
      gradient: ['#06b6d4', '#0891b2'],
    },
    status: 'active',
    plan: 'free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'item-1', businessId: 'heladeria-pinguino', name: 'Sundae de chocolate', price: 85, currency: 'MXN', description: 'Con 3 bolas de helado artesanal, crema batida y cereza', visible: true, order: 1, createdAt: '', updatedAt: '' },
      { id: 'item-2', businessId: 'heladeria-pinguino', name: 'Nieve de vainilla', price: 40, currency: 'MXN', description: 'Nieve artesanal de vainilla de Madagascar', visible: true, order: 2, createdAt: '', updatedAt: '' },
      { id: 'item-3', businessId: 'heladeria-pinguino', name: 'Malteada de fresa', price: 65, currency: 'MXN', description: 'Malteada cremosa con fresas naturales', visible: true, order: 3, createdAt: '', updatedAt: '' },
      { id: 'item-4', businessId: 'heladeria-pinguino', name: 'Paleta de mango', price: 30, currency: 'MXN', description: 'Paleta natural de mango con chile', visible: true, order: 4, createdAt: '', updatedAt: '' },
    ],
  },
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug is required' })

  // TODO Sprint 5: replace with real Firestore read
  const business = MOCK_BUSINESSES[slug]

  if (!business) {
    throw createError({ statusCode: 404, message: `Business '${slug}' not found` })
  }

  if (business.status === 'suspended') {
    throw createError({ statusCode: 410, message: 'This business is currently suspended' })
  }

  if (business.status !== 'active' && business.status !== 'demo') {
    throw createError({ statusCode: 404, message: `Business '${slug}' not found` })
  }

  // Strip sensitive fields before returning
  const { ...safe } = business
  return safe
})
