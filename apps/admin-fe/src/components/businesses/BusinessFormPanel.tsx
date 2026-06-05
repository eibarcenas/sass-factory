import { useCreateDemo } from '@/hooks/useBusinesses'
import type { Business } from '@eguru/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ImageUpload from '@/components/catalog/ImageUpload'
import { BUSINESS_TYPES, MEXICO_STATES } from './businessFormConstants'
import { useBusinessFormState, type BusinessFormDefaults } from './hooks/useBusinessFormState'
import { useRegisterFlow } from './hooks/useRegisterFlow'
import { useUpdateBusiness } from './hooks/useUpdateBusiness'

type RegisterProps = { mode: 'register' }
type CreateProps  = { mode: 'create'; onSuccess?: (slug: string) => void }
type EditProps    = {
  mode: 'edit'
  businessSlug: string
  defaultValues: BusinessFormDefaults & Pick<Business, 'status' | 'theme'>
  onSaved?: () => void
}
type OwnerProps   = {
  mode: 'owner'
  defaultValues?: BusinessFormDefaults
  businessSlug?: string
  readonly?: boolean
  onSaved?: () => void
}
type Props = RegisterProps | CreateProps | EditProps | OwnerProps

export default function BusinessFormPanel(props: Props) {
  const { mode } = props

  const isEdit      = mode === 'edit' || mode === 'owner'
  const isCreateMode = mode === 'register' || mode === 'create'
  const readonly    = mode === 'owner' && !!(props as OwnerProps).readonly

  const defaultValues = isEdit ? (props as EditProps | OwnerProps).defaultValues : undefined
  const businessSlug  = isEdit ? ((props as EditProps | OwnerProps).businessSlug ?? '') : ''

  const { values, setters, slugStatus, slug, error, setError, validate, reset } =
    useBusinessFormState(mode, defaultValues)

  const { register, pending: googlePending, redirectChecked } =
    useRegisterFlow(setError, () => setError('Ese nombre ya está en uso. Prueba con otro.'))

  const { save, isPending: savePending, saved } = useUpdateBusiness(businessSlug || undefined)

  const createDemo = useCreateDemo()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msgs = validate()
    if (msgs.length) { setError(msgs.join(' · ')); return }
    setError('')

    if (mode === 'register') {
      if (slugStatus !== 'available') { setError('Verifica que el nombre esté disponible'); return }
      await register(values)
      return
    }

    if (mode === 'create') {
      try {
        const business = await createDemo.mutateAsync({
          name:        values.name,
          type:        values.type as string,
          whatsapp:    values.whatsapp,
          city:        values.city,
          state:       values.state,
          tagline:     values.tagline     || undefined,
          contactName: values.contactName || undefined,
          ownerEmail:  values.ownerEmail  || undefined,
          logo:        values.logo        || undefined,
        })
        ;(props as CreateProps).onSuccess?.(business.slug)
        reset()
      } catch (err: unknown) {
        setError((err as Error).message ?? 'No se pudo crear el negocio')
      }
      return
    }

    save(values)
    ;(props as EditProps | OwnerProps).onSaved?.()
  }

  const isPending =
    mode === 'register' ? (googlePending || !redirectChecked) :
    mode === 'create'   ? createDemo.isPending :
                          savePending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Logo — all modes except register */}
      {mode !== 'register' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Logo{mode === 'create' && <span className="font-normal normal-case"> (opcional)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readonly ? (
              values.logo
                ? <img src={values.logo} alt="" className="w-16 h-16 rounded-xl object-cover" />
                : <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: ((defaultValues as any)?.theme?.primary ?? '#6366f1') + '20' }}
                  >
                    {(defaultValues as any)?.theme?.emoji ?? '🏪'}
                  </div>
            ) : (
              <>
                <ImageUpload
                  max={1}
                  folder="logos"
                  currentUrls={values.logo ? [values.logo] : []}
                  onChanged={urls => setters.setLogo(urls[0] ?? '')}
                />
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG o WebP · máx. 2 MB</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Type selector — grid always, interactive in create/register/owner, read-only in edit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de negocio{isCreateMode && <span className="text-destructive"> *</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {BUSINESS_TYPES.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={!isEdit && !readonly ? () => setters.setType(t.key) : undefined}
                disabled={isEdit && values.type !== t.key}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                  values.type === t.key
                    ? 'border-primary bg-primary/5'
                    : isEdit
                    ? 'border-border opacity-35'
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
              Nombre del negocio{isCreateMode && <span className="text-destructive"> *</span>}
            </Label>
            <div className="relative">
              <Input
                id="bfp-name"
                value={values.name}
                onChange={e => setters.setName(e.target.value)}
                placeholder="Ej. Barbería El Tigre"
                readOnly={readonly}
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
                (opcional{isEdit ? ` · ${values.tagline.length}/120` : ''})
              </span>
            </Label>
            <Input
              id="bfp-tagline"
              value={values.tagline}
              onChange={e => setters.setTagline(e.target.value)}
              maxLength={120}
              placeholder="Los mejores cortes del sur de la ciudad"
              readOnly={readonly}
            />
          </div>
          {isEdit && defaultValues?.slug && (
            <>
              <Separator />
              <div className="space-y-1">
                <Label className="text-muted-foreground">URL del catálogo</Label>
                <p className="text-sm font-mono py-1 text-primary">catalog.mx/{defaultValues.slug}</p>
              </div>
            </>
          )}
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
          {isCreateMode ? (
            <div className="space-y-1.5">
              <Label htmlFor="bfp-contact">
                {mode === 'register' ? 'Tu nombre' : 'Nombre del dueño'}{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="bfp-contact"
                value={values.contactName}
                onChange={e => setters.setContactName(e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
            </div>
          ) : (
            values.contactName && (
              <div className="space-y-1">
                <Label className="text-muted-foreground">Nombre de contacto</Label>
                <p className="text-sm py-1">{values.contactName}</p>
              </div>
            )
          )}

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="bfp-whatsapp">
              WhatsApp <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="bfp-whatsapp"
              value={values.whatsapp}
              onChange={e => setters.setWhatsapp(e.target.value.replace(/[^\d+]/g, ''))}
              placeholder="+52 55 1234 5678"
              type="tel"
              maxLength={16}
              readOnly={readonly}
            />
          </div>

          {mode === 'create' && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label htmlFor="bfp-owner-email">
                  Email del dueño <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="bfp-owner-email"
                  value={values.ownerEmail}
                  onChange={e => setters.setOwnerEmail(e.target.value)}
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
                value={values.city}
                onChange={e => setters.setCity(e.target.value)}
                placeholder="Ej. Monterrey"
                readOnly={readonly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bfp-state">Estado</Label>
              <select
                id="bfp-state"
                value={values.state}
                onChange={e => setters.setState(e.target.value)}
                disabled={readonly}
                className="w-full px-3.5 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-shadow disabled:opacity-50"
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

      {!readonly && (
        mode === 'register' ? (
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
              : saved ? '✓ Guardado' : savePending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        )
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
