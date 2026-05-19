import { defineEventHandler, readBody } from 'h3'
import { requireAuth } from '~~/server/middleware/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const { tagline, theme } = await readBody(event) ?? {}
  // TODO Sprint 5: update Firestore business document
  return { tagline, theme, updatedAt: new Date().toISOString() }
})
