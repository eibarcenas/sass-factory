import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS } from '../constants/plan-limits'

describe('PLAN_LIMITS', () => {
  it('free plan allows max 10 items', () => {
    expect(PLAN_LIMITS.free.maxItems).toBe(10)
  })

  it('pro plan allows max 100 items', () => {
    expect(PLAN_LIMITS.pro.maxItems).toBe(100)
  })

  it('growth plan has no limit', () => {
    expect(PLAN_LIMITS.growth.maxItems).toBe(Infinity)
  })
})
