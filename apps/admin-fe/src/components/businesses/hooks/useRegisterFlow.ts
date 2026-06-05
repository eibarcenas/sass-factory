import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { homeForRole, isLocale, routes } from '@/lib/routes'
import type { BusinessFormValues } from './useBusinessFormState'

const API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

export function useRegisterFlow(onError: (msg: string) => void, onSlugTaken: () => void) {
  const navigate = useNavigate()
  const { locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : 'es'
  const setUser = useAuthStore(state => state.setUser)
  const [pending, setPending] = useState(false)

  async function register(values: BusinessFormValues) {
    const { getAuth } = await import('firebase/auth')
    const firebaseUser = getAuth().currentUser
    if (!firebaseUser) {
      window.location.replace(`${LANDING_URL}/${locale}`)
      return
    }

    setPending(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/business-registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
        },
        body: JSON.stringify({
          businessName: values.name,
          type: values.type || undefined,
          whatsapp: values.whatsapp || undefined,
          city: values.city || undefined,
          state: values.state || undefined,
          tagline: values.tagline || undefined,
          contactName: values.contactName || undefined,
        }),
      })

      if (response.status === 409) {
        const error = await response.json().catch(() => ({}))
        if (error.detail !== 'Account already active') {
          onSlugTaken()
          return
        }
      } else if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail ?? `Error ${response.status}`)
      }

      const data = response.ok ? await response.json() : null
      const { claims } = await firebaseUser.getIdTokenResult(true)
      const role = (claims.role as string) ?? 'OWNER'
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role,
        businessId: (claims.business_id as string) ?? data?.slug ?? '',
        modules: (claims.modules as string[]) ?? [],
      })
      navigate(data?.slug ? routes.sellerProducts(locale) : homeForRole(locale, role), { replace: true })
    } catch (error) {
      onError((error as Error).message ?? 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setPending(false)
    }
  }

  return { register, pending, redirectChecked: true }
}
