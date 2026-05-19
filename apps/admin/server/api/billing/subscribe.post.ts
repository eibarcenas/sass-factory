import { defineEventHandler, readBody, createError } from 'h3'
import type { Plan } from '@sass-factory/core'
import { PLAN_PRICES } from '@sass-factory/core'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { plan } = await readBody(event) as { plan: Plan }

  if (!plan || !PLAN_PRICES[plan]) {
    throw createError({ statusCode: 400, message: 'Invalid plan' })
  }

  if (plan === 'free') {
    throw createError({ statusCode: 400, message: 'Cannot subscribe to free plan' })
  }

  // TODO Sprint 8: create MercadoPago Preapproval subscription
  // const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  // const preapproval = await new PreApproval(mp).create({ ... })

  const mockCheckoutUrl = `https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=mock_${plan}_${Date.now()}`

  return {
    checkoutUrl: mockCheckoutUrl,
    plan,
    price: PLAN_PRICES[plan],
    currency: 'MXN',
  }
})
