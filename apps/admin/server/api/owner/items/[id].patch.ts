import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { requireAuth } from '~~/server/middleware/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  // TODO Sprint 5: update Firestore item
  return { id, ...body, updatedAt: new Date().toISOString() }
})
