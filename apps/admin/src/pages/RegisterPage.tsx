import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function RegisterPage() {
  const store = useAuthStore()
  const navigate = useNavigate()

  const [businessName, setBusinessName] = useState('')
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Live slug availability check — debounced 400ms
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!businessName.trim()) {
      setSlugStatus('idle')
      setSlug('')
      return
    }
    setSlugStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/auth/check-slug?name=${encodeURIComponent(businessName.trim())}`
        )
        const data = await res.json()
        setSlug(data.slug ?? '')
        if (data.reason === 'invalid_name') setSlugStatus('invalid')
        else setSlugStatus(data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [businessName])

  const canSubmit = slugStatus === 'available' && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)

    try {
      const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
      const { initializeApp, getApps } = await import('firebase/app')

      if (!getApps().length) {
        initializeApp({
          apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
        })
      }

      const auth = getAuth()
      const cred = await signInWithPopup(auth, new GoogleAuthProvider())
      const token = await cred.user.getIdToken()

      const res = await fetch(`${API_URL}/api/v1/auth/auto-provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessName: businessName.trim() }),
      })

      if (res.status === 409) {
        // Name got taken between check and submit — ask to choose another
        setSlugStatus('taken')
        setError('Ese nombre ya fue tomado. Elige otro.')
        await auth.signOut()
        setLoading(false)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? `Error ${res.status}`)
      }

      const data = await res.json()

      // Force token refresh to pick up new OWNER claims
      await cred.user.getIdToken(true)

      store.setUser({
        uid:         cred.user.uid,
        email:       cred.user.email,
        displayName: cred.user.displayName ?? null,
        photoURL:    cred.user.photoURL ?? null,
        role:        'OWNER',
        businessId:  data.slug,
        modules:     ['CATALOG', 'APPEARANCE'],
      })

      navigate('/owner', { replace: true })
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false)
        return
      }
      setError(err.message ?? 'Ocurrió un error. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4">
      {/* Back to landing */}
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
                  {/* Status indicator */}
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

                {/* Slug preview / status messages */}
                {slugStatus === 'available' && slug && (
                  <p className="text-xs text-green-600">
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

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={!canSubmit}>
                {loading ? (
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
