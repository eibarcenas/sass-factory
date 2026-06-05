import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type UserRole } from '../store/auth'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { Button } from '@/components/ui/button'

const API_URL     = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export default function LoginPage() {
  const { mockMode, user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')

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

      const { getAuth } = await import('firebase/auth')
      await getAuth().signOut()
      setError('pending')
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
  }, [mockMode, navigate, user])

  if (mockMode) return null

  if (error === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm p-6 bg-amber-50 border border-amber-200 rounded-lg space-y-1 text-center">
          <p className="text-sm font-medium text-amber-800">Tu cuenta esta en revision</p>
          <p className="text-xs text-amber-700">Activamos tu catalogo en menos de 24 horas.</p>
        </div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5 rounded-lg border bg-white p-6 text-center shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Inicia sesión</h1>
          <p className="text-sm text-muted-foreground">Continúa con tu cuenta de Google.</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          className="w-full"
          disabled={!redirectChecked || pending}
          onClick={() => {
            setError('')
            signInWithGoogle().catch((err: any) => setError(err.message ?? 'Sign in failed'))
          }}
        >
          {pending ? 'Iniciando sesión...' : error ? 'Reintentar con Google' : 'Continuar con Google'}
        </Button>
      </div>
    </div>
  )
}
