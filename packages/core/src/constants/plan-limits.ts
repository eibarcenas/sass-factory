export const PLAN_LIMITS = {
  free:   { maxItems: 10,  subdomain: false, customDomain: false, viralFooter: true  },
  pro:    { maxItems: 100, subdomain: true,  customDomain: false, viralFooter: false },
  growth: { maxItems: Infinity, subdomain: true, customDomain: true, viralFooter: false },
} as const

export type Plan = keyof typeof PLAN_LIMITS

export const PLAN_PRICES: Record<Plan, number> = {
  free:   0,
  pro:    199,  // MXN/mes
  growth: 499,  // MXN/mes
}
