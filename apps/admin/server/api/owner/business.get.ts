import { defineEventHandler } from 'h3'
import { requireAuth } from '~~/server/middleware/auth'
import type { Business } from '@sass-factory/core'

const MOCK: Business = {
  id: 'heladeria-pinguino', slug: 'heladeria-pinguino', name: 'Heladería El Pingüino',
  type: 'heladeria', whatsapp: '+521234567890', city: 'Monterrey',
  tagline: 'La mejor heladería artesanal',
  theme: { primary: '#06b6d4', secondary: '#cffafe', accent: '#f59e0b', background: '#f0fdfe', font: 'Quicksand', emoji: '🍦', gradient: ['#06b6d4', '#0891b2'] },
  status: 'active', plan: 'free',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  // TODO Sprint 5: query Firestore businesses where ownerId == user.uid
  return MOCK
})
