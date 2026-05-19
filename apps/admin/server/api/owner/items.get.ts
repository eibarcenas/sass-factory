import { defineEventHandler } from 'h3'
import { requireAuth } from '~~/server/middleware/auth'
import type { Item } from '@sass-factory/core'

const MOCK_ITEMS: Item[] = [
  { id: 'item-1', businessId: 'heladeria-pinguino', name: 'Sundae de chocolate', price: 85, currency: 'MXN', description: 'Con 3 bolas de helado artesanal', visible: true, order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'item-2', businessId: 'heladeria-pinguino', name: 'Nieve de vainilla', price: 40, currency: 'MXN', visible: true, order: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'item-3', businessId: 'heladeria-pinguino', name: 'Malteada de fresa', price: 65, currency: 'MXN', visible: true, order: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  // TODO Sprint 5: query Firestore /businesses/{id}/items
  return { items: MOCK_ITEMS }
})
