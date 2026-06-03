import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'
const SESSION_KEY = 'pendingBusinessName'

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function clientSlugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export default function RegisterPage() {
  const store = useAuthStore()
  const navigate = useNavigate()

  const [businessName, setBusinessName] = useState('')
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Live slug availability check — debounced 200ms
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!businessName.trim()) {
      setSlugStatus('idle')
      setSlug('')
      return
    }
    setSlug(clientSlugify(businessName))
    setSlugStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/auth/check-slug?name=${encodeURIComponent(businessName.trim())}`
        )
        const data = await res.json()
        setSlug(data.slug ?? slug)
        if (data.reason === 'invalid_name') setSlugStatus('invalid')
        else setSlugStatus(data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 200)
    return () => clearTimeout(debounceRef.current)
  }, [businessName])

  const { signInWithGoogle, pending, redirectChecked } = useGoogleAuth(async (cred) => {
    // Read business name from sessionStorage (set before any redirect) and clear it
    const name = sessionStorage.getItem(SESSION_KEY) ?? businessName.trim()
    sessionStorage.removeItem(SESSION_KEY)

    if (!name) return

    const token = await cred.user.getIdToken()

    const res = await fetch(`${API_URL}/api/v1/auth/auto-provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ businessName: name }),
    })

    if (res.status === 409) {
      const errData = await res.json().catch(() => ({}))
      if (errData.detail === 'Account already active') {
        const { claims } = await cred.user.getIdTokenResult(true)
        const role = (claims.role as string) ?? 'OWNER'
        const businessId = (claims.business_id as string) ?? ''
        store.setUser({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName ?? null,
          photoURL: cred.user.photoURL ?? null,
          role,
          businessId,
          modules: (claims.modules as string[]) ?? [],
        })
        navigate(role === 'SUPER_ADMIN' ? '/dashboard' : '/owner', { replace: true })
      } else {
        setSlugStatus('taken')
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

    store.setUser({
      uid:         cred.user.uid,
      email:       cred.user.email,
      displayName: cred.user.displayName ?? null,
      photoURL:    cred.user.photoURL ?? null,
      role:        (claims.role as string) ?? 'OWNER',
      businessId:  data.slug,
      modules:     (claims.modules as string[]) ?? [],
    })

    navigate('/owner', { replace: true })
  })

  const canSubmit = slugStatus === 'available' && !pending && redirectChecked

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    // Persist name before sign-in (survives redirect back from Google on mobile)
    sessionStorage.setItem(SESSION_KEY, businessName.trim())
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message ?? 'Ocurrió un error. Intenta de nuevo.')
    }
  }

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
          <h1 className="text-2xl font-bold">Crea tu catálogo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Empieza gratis · 7 semanas de prueba
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">
                  ¿Cómo se llama tu negocio? <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="businessName"
                    placeholder="Heladería Pingüino"
                    required
                    autoFocus
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className={
                      slugStatus === 'taken' || slugStatus === 'invalid'
                        ? 'border-destructive focus-visible:ring-destructive'
                        : slugStatus === 'available'
                        ? 'border-green-500 focus-visible:ring-green-500'
                        : ''
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugStatus === 'checking' && (
                      <span className="h-4 w-4 block rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
                    )}
                    {slugStatus === 'available' && (
                      <svg viewBox="0 0 16 16" className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 8l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {(slugStatus === 'taken' || slugStatus === 'invalid') && (
                      <svg viewBox="0 0 16 16" className="h-4 w-4 text-destructive" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                </div>

                {(slugStatus === 'checking' || slugStatus === 'available') && slug && (
                  <p className={`text-xs ${slugStatus === 'available' ? 'text-green-600' : 'text-muted-foreground'}`}>
                    Tu link: <span className="font-medium">catalog.mx/{slug}</span>
                  </p>
                )}
                {slugStatus === 'taken' && (
                  <p className="text-xs text-destructive">Ese nombre ya está en uso. Prueba con otro.</p>
                )}
                {slugStatus === 'invalid' && (
                  <p className="text-xs text-destructive">El nombre no es válido. Usa letras y números.</p>
                )}
              </div>

              {error?.includes('Safari') ? (
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

              <Button type="submit" className="w-full gap-2" disabled={!canSubmit}>
                {pending ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Conectando con Google...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <a href="/login" className="underline underline-offset-2">Inicia sesión</a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
