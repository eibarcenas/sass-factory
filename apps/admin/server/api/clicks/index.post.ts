import { defineEventHandler, readBody, createError, getRequestIP } from 'h3'
import type { Click } from '@sass-factory/core'
import { logger } from '@sass-factory/core'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { businessId, itemId, source = 'storefront' } = body ?? {}

  if (!businessId || !itemId) {
    throw createError({ statusCode: 400, message: 'businessId and itemId are required' })
  }

  const click: Click = {
    id: `click-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    businessId,
    itemId,
    source,
    referrer: event.node.req.headers.referer ?? undefined,
    createdAt: new Date().toISOString(),
  }

  // TODO Sprint 8: write to Firestore with rate limiting (10 clicks/IP/item/hour)
  logger.info('click recorded', { businessId, itemId, source })

  return { success: true, id: click.id }
})
