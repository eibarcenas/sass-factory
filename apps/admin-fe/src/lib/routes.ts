export type Locale = 'es' | 'en'

export function isLocale(value: string | undefined): value is Locale {
  return value === 'es' || value === 'en'
}

export function browserLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

export function localeFromPath(pathname = window.location.pathname): Locale {
  const candidate = pathname.split('/')[1]
  return isLocale(candidate) ? candidate : browserLocale()
}

export const routes = {
  onboarding: (locale: Locale) => `/${locale}/onboarding/business`,
  sellerProducts: (locale: Locale) => `/${locale}/seller/products`,
  sellerRequests: (locale: Locale) => `/${locale}/seller/requests`,
  sellerProfile: (locale: Locale) => `/${locale}/seller/profile`,
  sellerLegal: (locale: Locale) => `/${locale}/seller/legal`,
  platformDashboard: (locale: Locale) => `/${locale}/platform/dashboard`,
  platformBusinesses: (locale: Locale) => `/${locale}/platform/businesses`,
  platformBusinessNew: (locale: Locale) => `/${locale}/platform/businesses/new`,
  platformBusiness: (locale: Locale, businessId: string) => `/${locale}/platform/businesses/${businessId}`,
  platformStore: (locale: Locale, businessId: string) => `/${locale}/platform/businesses/${businessId}/store`,
  platformImpersonate: (locale: Locale, businessId: string) => `/${locale}/platform/businesses/${businessId}/impersonate`,
  platformProfile: (locale: Locale) => `/${locale}/platform/profile`,
}

export function homeForRole(locale: Locale, role?: string | null): string {
  if (role === 'SUPER_ADMIN') return routes.platformDashboard(locale)
  if (role === 'OWNER') return routes.sellerProducts(locale)
  return routes.onboarding(locale)
}
