import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type UserRole } from '../store/auth'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { Button } from '@/components/ui/button'

const API_URL     = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export default function LoginPage() {
  const { mockMode, user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const autoStarted = useRef(false)

  const { signInWithGoogle, redirectChecked, pending } = useGoogleAuth(async (cred) => {
    setError('')
    const { claims } = await cred.user.getIdTokenResult(true)
    const role = claims.role as UserRole | undefined

    if (!role) {
      const freshToken = await cred.user.getIdToken(true)
      const resolved = await fetch(`${API_URL}/api/v1/auth/resolve-claims`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${freshToken}` },
      }).then(r => r.json()).catch(() => ({ resolved: false }))

      if (resolved.resolved) {
        const refreshed = await cred.user.getIdTokenResult(true)
        const refreshedRole = refreshed.claims.role as UserRole | undefined
        if (refreshedRole) {
          setUser({
            uid:        cred.user.uid,
            email:      cred.user.email,
            role:       refreshedRole,
            businessId: refreshed.claims.business_id as string | undefined,
            modules:    (refreshed.claims.modules as string[]) ?? [],
          })
          navigate(refreshedRole === 'SUPER_ADMIN' ? '/' : '/owner', { replace: true })
          return
        }
      }

      // No business found for this account — redirect to register so the user
      // can create or complete their business setup. Keep them signed in to Firebase
      // so the Google popup on /register returns immediately.
      navigate('/register', { replace: true })
      return
    }

    setUser({
      uid:        cred.user.uid,
      email:      cred.user.email,
      role,
      businessId: claims.business_id as string | undefined,
      modules:    (claims.modules as string[]) ?? [],
    })

    navigate(role === 'SUPER_ADMIN' ? '/' : '/owner', { replace: true })
  })

  useEffect(() => {
    if (mockMode) {
      navigate('/', { replace: true })
      return
    }
    if (user) {
      navigate(user.role === 'SUPER_ADMIN' ? '/' : '/owner', { replace: true })
      return
    }
    if (redirectChecked && !pending && !autoStarted.current) {
      autoStarted.current = true
      signInWithGoogle().catch((err: any) => {
        setError(err.message ?? 'Sign in failed')
      })
    }
  }, [mockMode, navigate, redirectChecked, pending, signInWithGoogle, user])

  if (mockMode) return null

  if (error?.includes('Safari')) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm p-6 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-center">
          <p className="text-sm font-medium text-blue-900">Abre en Safari para continuar</p>
          <p className="text-xs text-blue-700">Tu navegador no permite iniciar sesión con Google. Ábrelo en Safari.</p>
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs font-medium text-blue-700 underline underline-offset-2"
          >
            Abrir en Safari →
          </a>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              setError('')
              autoStarted.current = false
              signInWithGoogle().catch((err: any) => setError(err.message ?? 'Sign in failed'))
            }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )
}
