import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type UserRole } from '../store/auth'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const API_URL    = import.meta.env.VITE_API_URL    ?? 'http://localhost:8000'
const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

export default function LoginPage() {
  const { mockMode, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  if (mockMode) {
    navigate('/', { replace: true })
    return null
  }

  const { signInWithGoogle, pending, redirectChecked } = useGoogleAuth(async (cred) => {
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
        await cred.user.getIdToken(true)
        window.location.reload()
        return
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

  async function handleGoogleSignIn() {
    setError('')
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message ?? 'Sign in failed')
    }
  }

  const loading = pending || !redirectChecked

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4">
      <a
        href={LANDING_URL}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        catalog.mx
      </a>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">catalog.mx</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to manage your existing catalog</p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Button
              className="w-full gap-3"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            {error === 'pending' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                <p className="text-sm font-medium text-amber-800">Your account is under review</p>
                <p className="text-xs text-amber-700">
                  We activate your catalog within 24 hours.
                </p>
              </div>
            ) : error?.includes('Safari') ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-900">Abre en Safari para continuar</p>
                <p className="text-xs text-blue-700">
                  Tu navegador no permite iniciar sesión con Google. Ábrelo en Safari.
                </p>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs font-medium text-blue-700 underline underline-offset-2"
                >
                  Abrir en Safari →
                </a>
              </div>
            ) : error ? (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : null}

            <p className="text-xs text-center text-muted-foreground">
              No account?{' '}
              <a href="/register" className="underline underline-offset-2">
                Create your free catalog
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
