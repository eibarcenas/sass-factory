import { defineEventHandler } from 'h3'
import { requireAuth } from '~~/server/middleware/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event, { requiredRole: 'superadmin' })
  // TODO Sprint 8: aggregate from Firestore
  return {
    totalBusinesses: 2341,
    newThisWeek: 12,
    demosInPipeline: 45,
    activeBusinesses: 1876,
    suspendedBusinesses: 23,
    conversionRate: 34, // percent: demos -> active
    mrrEstimate: 8900, // MXN
  }
})
