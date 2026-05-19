import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS, PLAN_PRICES } from '../constants/plan-limits'

describe('PLAN_LIMITS', () => {
  it('free plan: 10 items, no subdomain, viral footer visible', () => {
    expect(PLAN_LIMITS.free.maxItems).toBe(10)
    expect(PLAN_LIMITS.free.subdomain).toBe(false)
    expect(PLAN_LIMITS.free.viralFooter).toBe(true)
  })

  it('pro plan: 100 items, subdomain, no viral footer', () => {
    expect(PLAN_LIMITS.pro.maxItems).toBe(100)
    expect(PLAN_LIMITS.pro.subdomain).toBe(true)
    expect(PLAN_LIMITS.pro.viralFooter).toBe(false)
  })

  it('growth plan: unlimited items, custom domain', () => {
    expect(PLAN_LIMITS.growth.maxItems).toBe(Infinity)
    expect(PLAN_LIMITS.growth.customDomain).toBe(true)
    expect(PLAN_LIMITS.growth.viralFooter).toBe(false)
  })
})

describe('PLAN_PRICES', () => {
  it('free is 0 MXN', () => {
    expect(PLAN_PRICES.free).toBe(0)
  })

  it('pro is 199 MXN', () => {
    expect(PLAN_PRICES.pro).toBe(199)
  })

  it('growth is 499 MXN', () => {
    expect(PLAN_PRICES.growth).toBe(499)
  })
})
