import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useBusinesses } from '@/hooks/useBusinesses'
import { useImpersonationStore } from '@/store/impersonation'
import { isLocale, routes } from '@/lib/routes'

export default function PlatformImpersonatePage() {
  const { businessId, locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : 'es'
  const { data, isLoading } = useBusinesses()
  const startImpersonation = useImpersonationStore(state => state.startImpersonation)
  const impersonating = useImpersonationStore(state => state.impersonating)
  const business = data?.businesses.find(item => item.id === businessId)

  useEffect(() => {
    if (business) startImpersonation(business.slug, business.name)
  }, [business, startImpersonation])

  if (isLoading) return null
  if (!business) return <Navigate to={routes.platformBusinesses(locale)} replace />
  if (impersonating?.businessId !== business.slug) return null
  return <Navigate to={routes.sellerProducts(locale)} replace />
}
