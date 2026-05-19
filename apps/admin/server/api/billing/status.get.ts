import { defineEventHandler } from 'h3'
import { requireAuth } from '~/server/middleware/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  // TODO Sprint 8: query Firestore for subscription status
  return {
    plan: 'free' as const,
    status: 'active',
    nextBillingDate: null,
    cancelAtPeriodEnd: false,
  }
})
