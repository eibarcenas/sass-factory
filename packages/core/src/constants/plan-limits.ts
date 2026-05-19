export const PLAN_LIMITS = {
  free:   { maxItems: 10 },
  pro:    { maxItems: 100 },
  growth: { maxItems: Infinity },
} as const

export type Plan = keyof typeof PLAN_LIMITS
