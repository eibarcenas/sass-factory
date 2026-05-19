import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { businessId, contactName, phone, email } = body ?? {}

  if (!businessId) {
    throw createError({ statusCode: 400, message: 'businessId is required' })
  }

  if (!phone && !email) {
    throw createError({ statusCode: 400, message: 'At least phone or email is required' })
  }

  // TODO Sprint 5: write to Firestore /prospects collection
  // TODO Sprint 5: trigger admin notification
  const prospect = {
    id: `prospect-${Date.now()}`,
    businessId,
    contactName: contactName ?? undefined,
    phone: phone ?? undefined,
    email: email ?? undefined,
    status: 'new' as const,
    createdAt: new Date().toISOString(),
  }

  return { success: true, prospectId: prospect.id }
})
