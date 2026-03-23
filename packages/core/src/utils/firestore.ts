export const COLLECTIONS = {
  APPS: 'apps',
  USERS: 'users',
  MOMENTS: 'moments',     // per-app user moments/photos
  ANALYTICS: 'analytics', // per-app analytics
} as const

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]
