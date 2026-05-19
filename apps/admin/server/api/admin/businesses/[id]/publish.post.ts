import { defineEventHandler, createError, getRouterParam } from 'h3'
import { requireAuth } from '~~/server/middleware/auth'
import { validateTransition } from '@sass-factory/core'

export default defineEventHandler(async (event) => {
  await requireAuth(event, { requiredRole: 'admin' })

  const id = getRouterParam(event, 'id')!

  // TODO Sprint 5: load from Firestore
  // For now, simulate the transition validation
  const currentStatus = 'draft' // would come from Firestore
  const transition = validateTransition(currentStatus, 'demo')

  if (!transition.valid) {
    throw createError({ statusCode: 422, message: transition.reason })
  }

  // TODO Sprint 5: write to Firestore
  return { id, status: 'demo', publishedAt: new Date().toISOString() }
})
