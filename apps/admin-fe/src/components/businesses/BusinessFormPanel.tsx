import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCreateDemo } from '@/hooks/useBusinesses'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { BusinessType } from '@eguru/core'
import type { Business } from '@eguru/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ImageUpload from '@/components/catalog/ImageUpload'
import { BUSINESS_TYPES, MEXICO_STATES } from './businessFormConstants'

const API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const SESSION_KEY = 'pendingBusinessForm'

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

type RegisterProps = { mode: 'register' }
type CreateProps  = { mode: 'create'; onSuccess?: (slug: string) => void }
type EditProps    = {
  mode: 'edit'
  businessSlug: string
  defaultValues: Pick<Business, 'logo' | 'type' | 'name' | 'whatsapp' | 'city' | 'state' | 'tagline' | 'theme' | 'ownerId' | 'ownerEmail' | 'contactName'>
  onSaved?: () => void
}
type Props = RegisterProps | CreateProps | EditProps

export default function BusinessFormPanel(props: Props) {
  const { mode } = props
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const createDemo = useCreateDemo()
  const qc = useQueryClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const defaultValues = mode === 'edit' ? (props as EditProps).defaultValues : undefined
  const businessSlug  = mode === 'edit' ? (props as EditProps).businessSlug  : ''

  const [logo,       setLogo]       = useState(defaultValues?.logo ?? '')
  const [type,       setType]       = useState<BusinessType | ''>(defaultValues?.type ?? '')
  const [name,       setName]       = useState(defaultValues?.name ?? '')
  const [tagline,    setTagline]    = useState(defaultValues?.tagline ?? '')
  const [whatsapp,   setWhatsapp]   = useState(defaultValues?.whatsapp ?? '')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [city,       setCity]       = useState(defaultValues?.city ?? '')
  const [state,      setState]      = useState(defaultValues?.state ?? 'Ciudad de México')
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [slug,       setSlug]       = useState('')
  const [error,      setError]      = useState('')
  const [saved,      setSaved]      = useState(false)

  // Sync form when edit defaultValues change (e.g. after query refetch)
  useEffect(() => {
    if (!defaultValues) return
    setLogo(defaultValues.logo ?? '')
    setType(defaultValues.type ?? '')
    setName(defaultValues.name)
    setTagline(defaultValues.tagline ?? '')
    setWhatsapp(defaultValues.whatsapp ?? '')
    setCity(defaultValues.city ?? '')
    setState(defaultValues.state ?? 'Ciudad de México')
  }, [defaultValues]) // eslint-disable-line react-hooks/exhaustive-deps

  // Slug availability check (register mode only)
  useEffect(() => {
    if (mode !== 'register') return
    clearTimeout(debounceRef.current)
    if (!name.trim()) { setSlugStatus('idle'); setSlug(''); return }
    setSlugStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/check-slug?name=${encodeURIComponent(name.trim())}`)
        const data = await res.json()
        setSlug(data.slug ?? '')
        if (data.reason === 'invalid_name') setSlugStatus('invalid')
        else setSlugStatus(data.available ? 'available' : 'taken')
      } catch { setSlugStatus('idle') }
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [name, mode])

  // Google auth callback (register mode only)
  const { signInWithGoogle, pending: googlePending, redirectChecked } = useGoogleAuth(async (cred) => {
    if (mode !== 'register') return
    const persisted = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') ?? { name, type, whatsapp, city, state, tagline }
    sessionStorage.removeItem(SESSION_KEY)

    const token = await cred.user.getIdToken()
    const res = await fetch(`${API_URL}/api/v1/auth/auto-provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        businessName: persisted.name,
        type:         persisted.type    || undefined,
        whatsapp:     persisted.whatsapp || undefined,
        city:         persisted.city    || undefined,
        state:        persisted.state   || undefined,
        tagline:      persisted.tagline || undefined,
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

  // Edit mode save
  const editSave = useMutation({
    mutationFn: () => api.patch(`/api/v1/owner/business?business=${businessSlug}`, {
      logo:     logo     || undefined,
      type:     type     || undefined,
      name,
      whatsapp: whatsapp || undefined,
      city:     city     || undefined,
      state:    state    || undefined,
      tagline:  tagline  || undefined,
    }),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      qc.invalidateQueries({ queryKey: ['businesses'] })
      ;(props as EditProps).onSaved?.()
    },
  })

  function validate() {
    const msgs: string[] = []
    if (!type) msgs.push('Selecciona el tipo de negocio')
    if (name.trim().length < 2) msgs.push('El nombre debe tener al menos 2 caracteres')
    if (mode === 'register' && slugStatus === 'taken')   msgs.push('Ese nombre ya está en uso')
    if (mode === 'register' && slugStatus === 'invalid') msgs.push('El nombre no es válido')
    if (whatsapp && !/^[0-9+]{7,15}$/.test(whatsapp.trim())) msgs.push('El WhatsApp debe ser un número válido')
    if (mode === 'create' && ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim()))
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
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name, type, whatsapp, city, state, tagline }))
      try { await signInWithGoogle() }
      catch (err: unknown) { setError((err as Error).message ?? 'Ocurrió un error. Intenta de nuevo.') }
      return
    }

    if (mode === 'create') {
      try {
        const business = await createDemo.mutateAsync({
          name, type: type as string, whatsapp, city, state,
          tagline:    tagline    || undefined,
          ownerEmail: ownerEmail || undefined,
          logo:       logo       || undefined,
        })
        ;(props as CreateProps).onSuccess?.(business.slug)
        setLogo(''); setType(''); setName(''); setTagline('')
        setWhatsapp(''); setOwnerEmail(''); setCity(''); setState('Ciudad de México')
      } catch (err: unknown) {
        setError((err as Error).message ?? 'No se pudo crear el negocio')
      }
      return
    }

    editSave.mutate()
  }

  const isPending =
    mode === 'register' ? (googlePending || !redirectChecked) :
    mode === 'create'   ? createDemo.isPending :
                          editSave.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Logo — create + edit only */}
      {mode !== 'register' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Logo{mode === 'create' && <span className="font-normal normal-case"> (opcional)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {mode === 'edit' && (
                logo
                  ? <img src={logo} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  : <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                      style={{ backgroundColor: (defaultValues?.theme?.primary ?? '#6366f1') + '20' }}
                    >
                      {defaultValues?.theme?.emoji ?? '🏪'}
                    </div>
              )}
              <div className="flex-1">
                <ImageUpload
                  max={1}
                  folder="logos"
                  currentUrls={logo ? [logo] : []}
                  onChanged={urls => setLogo(urls[0] ?? '')}
                />
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG o WebP · máx. 2 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Type selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de negocio{mode !== 'edit' && <span className="text-destructive"> *</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {BUSINESS_TYPES.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                  type === t.key
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
            <Label htmlFor="bfp-name">
              Nombre del negocio{mode !== 'edit' && <span className="text-destructive"> *</span>}
            </Label>
            <div className="relative">
              <Input
                id="bfp-name"
                value={name}
                onChange={e => setName(e.target.value)}
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
            <Label htmlFor="bfp-tagline">
              Tagline{' '}
              <span className="text-muted-foreground font-normal">
                (opcional{mode === 'edit' ? ` · ${tagline.length}/120` : ''})
              </span>
            </Label>
            <Input
              id="bfp-tagline"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              maxLength={120}
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
            <Label htmlFor="bfp-whatsapp">
              WhatsApp <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="bfp-whatsapp"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value.replace(/[^\d+]/g, ''))}
              placeholder="+52 55 1234 5678"
              type="tel"
              maxLength={16}
            />
          </div>

          {/* ownerEmail — create: editable, edit: read-only admin info */}
          {mode === 'create' && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label htmlFor="bfp-owner-email">
                  Email del dueño <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="bfp-owner-email"
                  value={ownerEmail}
                  onChange={e => setOwnerEmail(e.target.value)}
                  placeholder="dueno@gmail.com"
                  type="email"
                />
                <p className="text-xs text-muted-foreground">
                  Si lo proporcionas, el dueño quedará activado automáticamente.
                </p>
              </div>
            </>
          )}
          {mode === 'edit' && (
            <>
              <Separator />
              <div className="space-y-1">
                <Label className="text-muted-foreground">Dueño</Label>
                <p className="text-sm py-1">
                  {defaultValues?.ownerEmail
                    ? <span className="text-emerald-600 font-medium">{defaultValues.ownerEmail}</span>
                    : defaultValues?.ownerId
                    ? <span className="text-emerald-600 font-medium">Registrado</span>
                    : <span className="text-muted-foreground">Sin asignar</span>
                  }
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bfp-city">
                Ciudad <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="bfp-city"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ej. Monterrey"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bfp-state">Estado</Label>
              <select
                id="bfp-state"
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full px-3.5 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-shadow"
              >
                {MEXICO_STATES.map(s => <option key={s} value={s}>{s}</option>)}
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
        <Button type="submit" disabled={isPending} className="w-full">
          {mode === 'create'
            ? createDemo.isPending ? 'Creando...' : 'Crear negocio'
            : saved ? '✓ Guardado' : editSave.isPending ? 'Guardando...' : 'Guardar cambios'}
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
