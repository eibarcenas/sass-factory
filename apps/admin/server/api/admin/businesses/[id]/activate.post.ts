import { defineEventHandler, getRouterParam } from 'h3'
import { validateTransition } from '@sass-factory/core'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  await requireAuth(event, { requiredRole: 'admin' })
  const id = getRouterParam(event, 'id')!

  const currentStatus = 'accepted'
  const transition = validateTransition(currentStatus, 'active')
  if (!transition.valid) throw createError({ statusCode: 422, message: transition.reason })

  // TODO Sprint 5: send credentials email via Firebase Auth createUser
  return { id, status: 'active', activatedAt: new Date().toISOString() }
})
