import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const BUSINESS_TYPES = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'panaderia',   label: 'Panadería' },
  { value: 'heladeria',   label: 'Heladería' },
  { value: 'barberia',    label: 'Barbería' },
  { value: 'estetica',    label: 'Estética / Spa' },
  { value: 'gym',         label: 'Gimnasio' },
  { value: 'mecanico',    label: 'Mecánico' },
  { value: 'otro',        label: 'Otro' },
]

type Step = 'form' | 'loading' | 'success' | 'error'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')

  const [ownerName, setOwnerName]       = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [phone, setPhone]               = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!businessName.trim() || !businessType) return

    setError('')
    setStep('loading')

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

      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessName, businessType, ownerName: ownerName || null, phone: phone || null }),
      })

      if (res.status === 409) {
        // Already registered — sign out and show pending screen
        await auth.signOut()
        setStep('success')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? `Error ${res.status}`)
      }

      await auth.signOut()
      setStep('success')
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setStep('form')
        return
      }
      setError(err.message ?? 'Ocurrió un error. Intenta de nuevo.')
      setStep('error')
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">¡Solicitud recibida!</h1>
          <p className="text-muted-foreground text-sm">
            Revisamos tu catálogo y lo activamos en <strong>menos de 24 horas</strong>.
            Te avisaremos por correo cuando esté listo.
          </p>
          <p className="text-xs text-muted-foreground">¿Dudas? Escríbenos a hola@catalog.mx</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">catalog.mx</h1>
          <p className="text-muted-foreground text-sm mt-1">Crea tu catálogo digital</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ownerName">Tu nombre</Label>
                <Input
                  id="ownerName"
                  placeholder="María García"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessName">
                  Nombre de tu negocio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="Heladería Pingüino"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessType">
                  Tipo de negocio <span className="text-destructive">*</span>
                </Label>
                <select
                  id="businessType"
                  required
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Selecciona uno...</option>
                  {BUSINESS_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">WhatsApp del negocio</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              {(step === 'error') && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={step === 'loading'}
              >
                {step === 'loading' ? (
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
                Tu catálogo se activa en menos de 24 horas.
                <br />
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
