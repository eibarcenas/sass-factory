import { defineEventHandler, getRouterParam } from 'h3'
import { requireAuth } from '~/server/middleware/auth'
import { validateTransition } from '@sass-factory/core'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  await requireAuth(event, { requiredRole: 'admin' })
  const id = getRouterParam(event, 'id')!

  const currentStatus = 'demo'
  const transition = validateTransition(currentStatus, 'sent')
  if (!transition.valid) throw createError({ statusCode: 422, message: transition.reason })

  return { id, status: 'sent', sentAt: new Date().toISOString() }
})
