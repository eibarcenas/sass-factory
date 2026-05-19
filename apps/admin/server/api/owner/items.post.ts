import { defineEventHandler, readBody, createError } from 'h3'
import { PLAN_LIMITS } from '@sass-factory/core'
import type { Item } from '@sass-factory/core'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const { name, price, description, category, visible = true } = body ?? {}

  if (!name?.trim()) throw createError({ statusCode: 400, message: 'name is required' })
  if (typeof price !== 'number' || price < 0) throw createError({ statusCode: 400, message: 'price must be a non-negative number' })

  // Plan limit check — TODO Sprint 5: get real count from Firestore
  const MOCK_COUNT = 3
  const MOCK_PLAN = 'free'
  const limit = PLAN_LIMITS[MOCK_PLAN].maxItems
  if (MOCK_COUNT >= limit) {
    throw createError({
      statusCode: 403,
      message: `Plan limit reached (${limit} products). Upgrade to add more.`,
      data: { limit, current: MOCK_COUNT, upgradeUrl: '/owner/plan' },
    })
  }

  const item: Item = {
    id: `item-${Date.now()}`,
    businessId: 'heladeria-pinguino',
    name: name.trim(), price, currency: 'MXN',
    description: description?.trim() || undefined,
    category: category?.trim() || undefined,
    visible, order: MOCK_COUNT + 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
  // TODO Sprint 5: write to Firestore
  return item
})
