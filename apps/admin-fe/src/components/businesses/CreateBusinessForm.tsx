import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateDemo } from '../../hooks/useBusinesses'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { useAuthStore } from '../../store/auth'
import { BusinessType } from '@eguru/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const SESSION_KEY = 'pendingBusinessForm'

const TYPES: { key: BusinessType; label: string; emoji: string }[] = [
  { key: BusinessType.Heladeria,   label: 'Heladería',  emoji: '🍦' },
  { key: BusinessType.Barberia,    label: 'Barbería',   emoji: '💈' },
  { key: BusinessType.Estetica,    label: 'Estética',   emoji: '💅' },
  { key: BusinessType.Restaurante, label: 'Restaurante',emoji: '🍽️' },
  { key: BusinessType.Panaderia,   label: 'Panadería',  emoji: '🥐' },
  { key: BusinessType.Gym,         label: 'Gimnasio',   emoji: '💪' },
  { key: BusinessType.Mecanico,    label: 'Mecánico',   emoji: '🔧' },
  { key: BusinessType.Otro,        label: 'Otro',       emoji: '🏪' },
]

const MEXICO_STATES = [
  'Ciudad de México', 'Estado de México', 'Jalisco', 'Nuevo León', 'Puebla',
  'Guanajuato', 'Chihuahua', 'Baja California', 'Veracruz', 'Sonora',
  'Tamaulipas', 'Coahuila', 'Michoacán', 'Oaxaca', 'Chiapas',
  'Guerrero', 'Hidalgo', 'Sinaloa', 'San Luis Potosí', 'Tabasco',
  'Yucatán', 'Querétaro', 'Morelos', 'Durango', 'Zacatecas',
  'Aguascalientes', 'Quintana Roo', 'Tlaxcala', 'Nayarit', 'Campeche',
  'Colima', 'Baja California Sur',
]

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface AdminProps { mode: 'admin'; onSuccess?: (slug: string) => void }
interface RegisterProps { mode: 'register' }
type Props = AdminProps | RegisterProps

export default function CreateBusinessForm(props: Props) {
  const { mode } = props
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const createDemo = useCreateDemo()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const [form, setForm] = useState({
    type: '' as BusinessType | '',
    name: '',
    contactName: '',
    whatsapp: '',
    ownerEmail: '',
    city: '',
    state: 'Ciudad de México',
    tagline: '',
  })
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')

  // Slug availability check — register mode only
  useEffect(() => {
    if (mode !== 'register') return
    clearTimeout(debounceRef.current)
    if (!form.name.trim()) { setSlugStatus('idle'); setSlug(''); return }
    setSlugStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/check-slug?name=${encodeURIComponent(form.name.trim())}`)
        const data = await res.json()
        setSlug(data.slug ?? '')
        if (data.reason === 'invalid_name') setSlugStatus('invalid')
        else setSlugStatus(data.available ? 'available' : 'taken')
      } catch { setSlugStatus('idle') }
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [form.name, mode])

  // Google auth callback — register mode
  const { signInWithGoogle, pending: googlePending, redirectChecked } = useGoogleAuth(async (cred) => {
    if (mode !== 'register') return
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') ?? form
    sessionStorage.removeItem(SESSION_KEY)

    const token = await cred.user.getIdToken()
    const res = await fetch(`${API_URL}/api/v1/auth/auto-provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        businessName: saved.name,
        type:         saved.type || undefined,
        whatsapp:     saved.whatsapp || undefined,
        city:         saved.city || undefined,
        state:        saved.state || undefined,
        tagline:      saved.tagline || undefined,
        contactName:  saved.contactName || undefined,
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
          photoURL: cred.user.photoURL ?? null,
          role, businessId: (claims.business_id as string) ?? '',
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
    setUser({
      uid: cred.user.uid, email: cred.user.email,
      displayName: cred.user.displayName ?? null,
      photoURL: cred.user.photoURL ?? null,
      role: (claims.role as string) ?? 'OWNER',
      businessId: data.slug,
      modules: (claims.modules as string[]) ?? [],
    })
    navigate('/owner', { replace: true })
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  function validate() {
    const msgs: string[] = []
    if (!form.type) msgs.push('Selecciona el tipo de negocio')
    if (form.name.trim().length < 2) msgs.push('El nombre debe tener al menos 2 caracteres')
    if (mode === 'register' && slugStatus === 'taken') msgs.push('Ese nombre ya está en uso')
    if (mode === 'register' && slugStatus === 'invalid') msgs.push('El nombre no es válido')
    if (form.whatsapp && !/^[0-9+]{7,15}$/.test(form.whatsapp.trim())) msgs.push('El WhatsApp debe ser un número válido (7-15 dígitos)')
    if (form.city && form.city.trim().length < 2) msgs.push('La ciudad debe tener al menos 2 caracteres')
    if (mode === 'admin' && form.ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail.trim()))
      msgs.push('El email del dueño no es válido')
    return msgs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msgs = validate()
    if (msgs.length) { setError(msgs.join(' · ')); return }
    setError('')

    if (mode === 'register') {
      if (slugStatus !== 'available') { setError('Verifica que el nombre esté disponible'); return }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(form))
      try { await signInWithGoogle() }
      catch (err: any) { setError(err.message ?? 'Ocurrió un error. Intenta de nuevo.') }
      return
    }

    // admin mode
    try {
      const business = await createDemo.mutateAsync({
        name:       form.name,
        type:       form.type as string,
        whatsapp:   form.whatsapp,
        city:       form.city,
        state:      form.state,
        tagline:    form.tagline || undefined,
        contactName: form.contactName || undefined,
        ownerEmail: form.ownerEmail || undefined,
      })
      if (props.mode === 'admin') props.onSuccess?.(business.slug)
      setForm({ type: '', name: '', contactName: '', whatsapp: '', ownerEmail: '', city: '', state: 'Ciudad de México', tagline: '' })
    } catch (err: any) {
      setError(err.message ?? 'No se pudo crear el negocio')
    }
  }

  const isPending = mode === 'register' ? (googlePending || !redirectChecked) : createDemo.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Type selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de negocio *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t.key }))}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                  form.type === t.key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="text-xs font-medium text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business data */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Datos del negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="biz-name">Nombre del negocio *</Label>
            <div className="relative">
              <Input
                id="biz-name"
                value={form.name}
                onChange={set('name')}
                placeholder="Ej. Barbería El Tigre"
                className={
                  mode === 'register'
                    ? slugStatus === 'taken' || slugStatus === 'invalid'
                      ? 'border-destructive focus-visible:ring-destructive'
                      : slugStatus === 'available'
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : ''
                    : ''
                }
              />
              {mode === 'register' && (
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
              )}
            </div>
            {mode === 'register' && slug && (slugStatus === 'available' || slugStatus === 'checking') && (
              <p className={`text-xs ${slugStatus === 'available' ? 'text-green-600' : 'text-muted-foreground'}`}>
                Tu link: <span className="font-medium">catalog.mx/{slug}</span>
              </p>
            )}
            {mode === 'register' && slugStatus === 'taken' && (
              <p className="text-xs text-destructive">Ese nombre ya está en uso. Prueba con otro.</p>
            )}
            {mode === 'register' && slugStatus === 'invalid' && (
              <p className="text-xs text-destructive">El nombre no es válido. Usa letras y números.</p>
            )}
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="biz-tagline">
              Tagline <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="biz-tagline"
              value={form.tagline}
              onChange={set('tagline')}
              placeholder="Los mejores cortes del sur de la ciudad"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="biz-contact">
              {mode === 'register' ? 'Tu nombre' : 'Nombre del dueño'}{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="biz-contact"
              value={form.contactName}
              onChange={set('contactName')}
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="biz-whatsapp">
              WhatsApp <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="biz-whatsapp"
              value={form.whatsapp}
              onChange={e => {
                const val = e.target.value.replace(/[^\d+]/g, '')
                setForm(f => ({ ...f, whatsapp: val }))
              }}
              placeholder="+52 55 1234 5678"
              type="tel"
              maxLength={16}
            />
          </div>
          {mode === 'admin' && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label htmlFor="biz-owner-email">
                  Email del dueño <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="biz-owner-email"
                  value={form.ownerEmail}
                  onChange={set('ownerEmail')}
                  placeholder="dueno@gmail.com"
                  type="email"
                />
                <p className="text-xs text-muted-foreground">
                  Si lo proporcionas, el dueño quedará activado automáticamente.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="biz-city">
                Ciudad <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="biz-city"
                value={form.city}
                onChange={set('city')}
                placeholder="Ej. Monterrey"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-state">Estado</Label>
              <select
                id="biz-state"
                value={form.state}
                onChange={set('state')}
                className="w-full px-3.5 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-shadow"
              >
                {MEXICO_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        error.includes('Safari') ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <p className="text-sm font-medium text-blue-900">Abre en Safari para continuar</p>
            <p className="text-xs text-blue-700">Tu navegador no permite iniciar sesión con Google. Ábrelo en Safari.</p>
            <a href={window.location.href} target="_blank" rel="noopener noreferrer"
               className="block text-center text-xs font-medium text-blue-700 underline underline-offset-2">
              Abrir en Safari →
            </a>
          </div>
        ) : (
          <p className="text-xs text-destructive">{error}</p>
        )
      )}

      {mode === 'register' ? (
        <Button
          type="submit"
          className="w-full gap-2"
          disabled={isPending || slugStatus === 'taken' || slugStatus === 'invalid' || slugStatus === 'checking'}
        >
          {googlePending ? (
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
      ) : (
        <Button type="submit" disabled={createDemo.isPending} className="w-full">
          {createDemo.isPending ? 'Creando...' : 'Crear negocio'}
        </Button>
      )}

      {mode === 'register' && (
        <p className="text-xs text-center text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="underline underline-offset-2">Inicia sesión</a>
        </p>
      )}
    </form>
  )
}
