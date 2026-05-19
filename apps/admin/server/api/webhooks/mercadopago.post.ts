import { defineEventHandler, readBody, getHeader, createError } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { logger } from '@sass-factory/core'

function verifyMpSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    logger.warn('MP_WEBHOOK_SECRET not configured — skipping signature check in dev')
  }

  const rawBody = await event.node.req.text?.() ?? JSON.stringify(await readBody(event))
  const signature = getHeader(event, 'x-signature') ?? ''

  if (secret && signature) {
    if (!verifyMpSignature(rawBody, signature, secret)) {
      throw createError({ statusCode: 401, message: 'Invalid webhook signature' })
    }
  }

  const body = JSON.parse(rawBody)
  const { type, data } = body

  logger.info('mercadopago webhook received', { type, dataId: data?.id })

  if (type === 'payment') {
    const paymentId = data?.id
    // Idempotency: check if already processed (TODO Sprint 8: Firestore billing_events)
    // Update business plan in Firestore (TODO Sprint 8)
    logger.info('payment webhook processed', { paymentId })
  }

  if (type === 'subscription_preapproval') {
    const preapprovalId = data?.id
    // Handle subscription status changes (TODO Sprint 8)
    logger.info('subscription webhook processed', { preapprovalId })
  }

  // Always return 200 to MercadoPago to prevent retries
  return { received: true }
})
