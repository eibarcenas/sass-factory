import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import type { BusinessFormValues } from './useBusinessFormState'

const API_URL    = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const SESSION_KEY = 'pendingBusinessForm'

export function useRegisterFlow(onError: (msg: string) => void, onSlugTaken: () => void) {
  const navigate  = useNavigate()
  const { setUser } = useAuthStore()

  const { signInWithGoogle, pending, redirectChecked } = useGoogleAuth(async (cred) => {
    const saved: BusinessFormValues = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') ?? {}
    sessionStorage.removeItem(SESSION_KEY)

    const token = await cred.user.getIdToken()
    const res   = await fetch(`${API_URL}/api/v1/auth/auto-provision`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        businessName: saved.name,
        type:         saved.type     || undefined,
        whatsapp:     saved.whatsapp || undefined,
        city:         saved.city     || undefined,
        state:        saved.state    || undefined,
        tagline:      saved.tagline  || undefined,
      }),
    })

    if (res.status === 409) {
      const errData = await res.json().catch(() => ({}))
      if (errData.detail === 'Account already active') {
        const { claims } = await cred.user.getIdTokenResult(true)
        const role = (claims.role as string) ?? 'OWNER'
        setUser({
          uid: cred.user.uid, email: cred.user.email,
          displayName: cred.user.displayName ?? null,
          photoURL:    cred.user.photoURL    ?? null,
          role, businessId: (claims.business_id as string) ?? '',
          modules: (claims.modules as string[]) ?? [],
        })
        navigate(role === 'SUPER_ADMIN' ? '/dashboard' : '/owner', { replace: true })
      } else {
        onSlugTaken()
        const { getAuth } = await import('firebase/auth')
        await getAuth().signOut()
      }
      return
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail ?? `Error ${res.status}`)
    }

    const data = await res.json()
    const { claims } = await cred.user.getIdTokenResult(true)
    setUser({
      uid: cred.user.uid, email: cred.user.email,
      displayName: cred.user.displayName ?? null,
      photoURL:    cred.user.photoURL    ?? null,
      role:        (claims.role       as string)   ?? 'OWNER',
      businessId:  data.slug,
      modules:     (claims.modules    as string[]) ?? [],
    })
    navigate('/owner', { replace: true })
  })

  async function register(values: BusinessFormValues) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(values))
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      onError((err as Error).message ?? 'Ocurrió un error. Intenta de nuevo.')
    }
  }

  return { register, pending, redirectChecked }
}
