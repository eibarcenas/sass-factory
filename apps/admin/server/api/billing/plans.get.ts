import { defineEventHandler } from 'h3'
import { PLAN_LIMITS, PLAN_PRICES } from '@sass-factory/core'

export default defineEventHandler(() => {
  return {
    plans: [
      {
        id: 'free',
        name: 'Gratis',
        price: PLAN_PRICES.free,
        currency: 'MXN',
        features: [
          `${PLAN_LIMITS.free.maxItems} productos`,
          'URL: catalog.mx/{slug}',
          'Footer "Hecho con catalog.mx"',
        ],
        limits: PLAN_LIMITS.free,
      },
      {
        id: 'pro',
        name: 'Pro',
        price: PLAN_PRICES.pro,
        currency: 'MXN',
        features: [
          `${PLAN_LIMITS.pro.maxItems} productos`,
          'Subdominio: negocio.catalog.mx',
          'Sin footer viral',
          'Analytics detallado',
        ],
        limits: PLAN_LIMITS.pro,
        recommended: true,
      },
      {
        id: 'growth',
        name: 'Growth',
        price: PLAN_PRICES.growth,
        currency: 'MXN',
        features: [
          'Productos ilimitados',
          'Dominio propio',
          'Sin footer viral',
          'Soporte prioritario',
        ],
        limits: PLAN_LIMITS.growth,
      },
    ],
  }
})
