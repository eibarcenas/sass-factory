import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { homeForRole, isLocale, routes } from '@/lib/routes'
import type { BusinessFormValues } from './useBusinessFormState'
import type { DraftProduct } from '@/components/catalog/ProductEditor'

const API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

export function useRegisterFlow(onError: (msg: string) => void, onSlugTaken: () => void) {
  const navigate = useNavigate()
  const { locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : 'es'
  const setUser = useAuthStore(state => state.setUser)
  const [pending, setPending] = useState(false)

  async function register(
    values: BusinessFormValues,
    products: DraftProduct[],
    acceptedTerms: boolean,
  ) {
    const { getAuth } = await import('firebase/auth')
    const { initializeApp, getApps } = await import('firebase/app')
    if (!getApps().length) {
      initializeApp({
        apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
      })
    }
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
          contactName: values.contactName || undefined,
          logo: values.logo || undefined,
          acceptedTerms,
          products: products.map(({ name, price, description, images }) => ({
            name,
            price,
            description,
            images,
          })),
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
