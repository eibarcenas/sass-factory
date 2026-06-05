import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { isLocale, homeForRole } from '@/lib/routes'
import { useAuthStore, type UserRole } from '@/store/auth'

const IDENTITY_API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8001'

export default function AuthCallbackPage() {
  const { locale: localeParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setUser = useAuthStore(state => state.setUser)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLocale(localeParam)) return
    const code = searchParams.get('code')
    if (!code) {
      setError('Missing authentication code.')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(`${IDENTITY_API_URL}/api/v1/auth/exchanges/${encodeURIComponent(code)}/consume`, {
          method: 'POST',
        })
        if (!response.ok) throw new Error('Authentication code is invalid or expired.')
        const { customToken } = await response.json()

        const { initializeApp, getApps } = await import('firebase/app')
        const { getAuth, signInWithCustomToken } = await import('firebase/auth')
        if (!getApps().length) {
          initializeApp({
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          })
        }

        const credential = await signInWithCustomToken(getAuth(), customToken)
        const tokenResult = await credential.user.getIdTokenResult(true)
        const role = tokenResult.claims.role as UserRole | undefined
        if (!cancelled) {
          const resolvedRole = role ?? 'UNASSIGNED'
          setUser({
            uid: credential.user.uid,
            email: credential.user.email,
            displayName: credential.user.displayName,
            photoURL: credential.user.photoURL,
            role: resolvedRole,
            businessId: tokenResult.claims.business_id as string | undefined,
            modules: (tokenResult.claims.modules as string[]) ?? [],
          })
          const returnTo = searchParams.get('returnTo')
          const allowedReturnTo =
            returnTo?.startsWith(`/${localeParam}/platform/`) && resolvedRole === 'SUPER_ADMIN'
            || returnTo?.startsWith(`/${localeParam}/seller/`) && resolvedRole === 'OWNER'
            || returnTo === `/${localeParam}/onboarding/business` && resolvedRole === 'UNASSIGNED'
          navigate(allowedReturnTo && returnTo ? returnTo : homeForRole(localeParam, resolvedRole), { replace: true })
        }
      } catch (callbackError: any) {
        if (!cancelled) setError(callbackError.message ?? 'Authentication failed.')
      }
    })()

    return () => { cancelled = true }
  }, [localeParam, navigate, searchParams, setUser])

  if (error) {
    return <div className="min-h-screen grid place-items-center p-6 text-sm text-destructive">{error}</div>
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
    </div>
  )
}
