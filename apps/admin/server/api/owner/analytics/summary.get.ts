import { defineEventHandler } from 'h3'
import { requireAuth } from '~~/server/middleware/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  // TODO Sprint 8: aggregate from Firestore clicks collection
  return {
    visitsThisMonth: 1234,
    clicksThisMonth: 89,
    topProduct: { id: 'item-1', name: 'Sundae de chocolate', clicks: 34 },
  }
})
