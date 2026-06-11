import { useCreateStore } from '@/hooks/useBusinesses'
import { useParams } from 'react-router-dom'
import { isLocale } from '@/lib/routes'
import type { Business } from '@eguru/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ImageUpload from '@/components/catalog/ImageUpload'
import ProductEditor, { isDraftProductComplete, type DraftProduct } from '@/components/catalog/ProductEditor'
import { BUSINESS_TYPES, MEXICO_STATES } from './businessFormConstants'
import {
  useBusinessFormState,
  readOnboardingDraft,
  writeOnboardingDraft,
  type BusinessFormDefaults,
  type BusinessFormValues,
  type SlugStatus,
} from './hooks/useBusinessFormState'
import { useRegisterFlow } from './hooks/useRegisterFlow'
import { useUpdateBusiness } from './hooks/useUpdateBusiness'
import { useAuthStore } from '@/store/auth'
import { useEffect, useState } from 'react'

type RegisterProps = { mode: 'register' }
type CreateProps  = { mode: 'create'; onSuccess?: (slug: string) => void }
type EditProps    = {
  mode: 'edit'
  businessSlug: string
  defaultValues: BusinessFormDefaults & Pick<Business, 'status' | 'theme'>
  onSaved?: () => void
}
type SellerProps   = {
  mode: 'seller'
  defaultValues?: BusinessFormDefaults
  businessSlug?: string
  readonly?: boolean
  onSaved?: () => void
}
type Props = RegisterProps | CreateProps | EditProps | SellerProps

const REGISTRATION_STEPS = [
  { title: 'Negocio', description: 'Identidad' },
  { title: 'Contacto', description: 'Datos' },
  { title: 'Productos', description: 'Catálogo' },
  { title: 'Confirmar', description: 'Revisión' },
] as const

export function getRegistrationStepError(
  step: number,
  values: BusinessFormValues,
  slugStatus: SlugStatus,
  products: DraftProduct[],
) {
  if (step === 0) {
    if (!values.logo) return 'Agrega el logo de tu negocio'
    if (!values.type) return 'Selecciona el tipo de negocio'
    if (values.name.trim().length < 2) return 'Escribe el nombre de tu negocio'
    if (slugStatus !== 'available') return 'Espera y verifica que el nombre esté disponible'
  }

  if (step === 1) {
    if (values.contactName.trim().length < 2) return 'Escribe tu nombre'
    if (!/^[0-9+]{7,15}$/.test(values.whatsapp.trim())) return 'Escribe un WhatsApp válido'
    if (values.city.trim().length < 2) return 'Escribe tu ciudad'
    if (!values.state) return 'Selecciona tu estado'
  }

  if (step === 2 && (!products.length || !products.every(isDraftProductComplete))) {
    return 'Agrega al menos un producto con nombre, precio, descripción e imagen'
  }

  return ''
}

export function isRegistrationComplete(
  values: BusinessFormValues,
  slugStatus: SlugStatus,
  products: DraftProduct[],
  acceptedTerms: boolean,
) {
  return (
    !!values.logo
    && !!values.type
    && values.name.trim().length >= 2
    && values.contactName.trim().length >= 2
    && /^[0-9+]{7,15}$/.test(values.whatsapp.trim())
    && values.city.trim().length >= 2
    && !!values.state
    && slugStatus === 'available'
    && products.length > 0
    && products.every(isDraftProductComplete)
    && acceptedTerms
  )
}

export default function BusinessFormPanel(props: Props) {
  const { mode } = props
  const { locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : 'es'

  const isEdit      = mode === 'edit' || mode === 'seller'
  const isCreateMode = mode === 'register' || mode === 'create'
  const isRegisterMode = mode === 'register'
  const readonly    = mode === 'seller' && !!(props as SellerProps).readonly

  const defaultValues = isEdit ? (props as EditProps | SellerProps).defaultValues : undefined
  const businessSlug  = isEdit ? ((props as EditProps | SellerProps).businessSlug ?? '') : ''

  const uid = useAuthStore(state => state.user?.uid)
  const draft = isRegisterMode && uid ? readOnboardingDraft(uid) : null
  const draftDefaults: BusinessFormDefaults | undefined = draft
    ? { ...draft.values, type: draft.values.type || undefined }
    : undefined

  const { values, setters, slugStatus, slug, error, setError, validate, reset } =
    useBusinessFormState(mode, isRegisterMode ? draftDefaults ?? defaultValues : defaultValues)

  const { register, pending: registrationPending, redirectChecked } =
    useRegisterFlow(setError, () => setError('Ese nombre ya está en uso. Prueba con otro.'))

  const { save, isPending: savePending, saved } = useUpdateBusiness(businessSlug || undefined)
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>(draft?.draftProducts ?? [])
  const [acceptedTerms, setAcceptedTerms] = useState(draft?.acceptedTerms ?? false)
  const [registrationStep, setRegistrationStep] = useState(draft?.registrationStep ?? 0)
  const [furthestStep, setFurthestStep] = useState(draft?.furthestStep ?? 0)

  useEffect(() => {
    if (!isRegisterMode || !uid) return
    writeOnboardingDraft(uid, { values, draftProducts, acceptedTerms, registrationStep, furthestStep })
  }, [
    isRegisterMode, uid,
    values.logo, values.type, values.name, values.contactName, values.whatsapp, values.city, values.state,
    draftProducts, acceptedTerms, registrationStep, furthestStep,
  ])

  const createStore = useCreateStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'register' && registrationStep < REGISTRATION_STEPS.length - 1) {
      goToNextStep()
      return
    }
    const msgs = validate()
    if (msgs.length) { setError(msgs.join(' · ')); return }
    setError('')

    if (mode === 'register') {
      if (slugStatus !== 'available') { setError('Verifica que el nombre esté disponible'); return }
      if (!acceptedTerms) { setError('Debes aceptar los términos y condiciones'); return }
      if (!draftProducts.length || !draftProducts.every(isDraftProductComplete)) {
        setError('Agrega al menos un producto con nombre, precio, descripción e imagen')
        return
      }
      await register(values, draftProducts, acceptedTerms)
      return
    }

    if (mode === 'create') {
      try {
        const business = await createStore.mutateAsync({
          name:        values.name,
          type:        values.type as string,
          whatsapp:    values.whatsapp,
          city:        values.city,
          state:       values.state,
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
    ;(props as EditProps | SellerProps).onSaved?.()
  }

  const isPending =
    mode === 'register' ? (registrationPending || !redirectChecked) :
    mode === 'create'   ? createStore.isPending :
                          savePending
  const registerComplete = isRegistrationComplete(
    values,
    slugStatus,
    draftProducts,
    acceptedTerms,
  )
  const showBusinessIdentity = !isRegisterMode || registrationStep === 0
  const showContact = !isRegisterMode || registrationStep === 1
  const showProducts = isRegisterMode && registrationStep === 2
  const showConfirmation = isRegisterMode && registrationStep === 3

  function goToNextStep() {
    const stepError = getRegistrationStepError(
      registrationStep,
      values,
      slugStatus,
      draftProducts,
    )
    if (stepError) {
      setError(stepError)
      return
    }

    setError('')
    const nextStep = Math.min(registrationStep + 1, REGISTRATION_STEPS.length - 1)
    setRegistrationStep(nextStep)
    setFurthestStep(current => Math.max(current, nextStep))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToStep(step: number) {
    if (step > furthestStep) return
    setError('')
    setRegistrationStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isRegisterMode && (
        <nav aria-label="Progreso del registro" className="rounded-xl border border-border bg-background p-3 sm:p-4">
          <ol className="grid grid-cols-4 gap-1 sm:gap-3">
            {REGISTRATION_STEPS.map((step, index) => {
              const isActive = registrationStep === index
              const isCompleted = index < registrationStep || index < furthestStep
              const isAvailable = index <= furthestStep

              return (
                <li key={step.title} className="relative">
                  {index < REGISTRATION_STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-4 h-px ${
                        index < registrationStep ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    disabled={!isAvailable}
                    aria-current={isActive ? 'step' : undefined}
                    className="relative z-10 flex w-full flex-col items-center gap-1.5 text-center disabled:cursor-default"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : isCompleted
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {isCompleted && !isActive ? '✓' : index + 1}
                    </span>
                    <span className={`text-[11px] font-medium leading-tight sm:text-xs ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                    <span className="hidden text-[10px] text-muted-foreground sm:block">
                      {step.description}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted sm:hidden">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${((registrationStep + 1) / REGISTRATION_STEPS.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground sm:hidden">
            Paso {registrationStep + 1} de {REGISTRATION_STEPS.length}
          </p>
        </nav>
      )}

      {/* Logo */}
      {showBusinessIdentity && <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Logo
              {mode === 'register' && <span className="text-destructive"> *</span>}
              {mode === 'create' && <span className="font-normal normal-case"> (opcional)</span>}
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
                  uploadPath={
                    mode === 'register'
                      ? '/api/v1/business-registration-images'
                      : businessSlug || defaultValues?.slug
                        ? `/api/v1/stores/${encodeURIComponent(businessSlug || defaultValues?.slug || '')}/images`
                        : '/api/v1/stores/new-business/images'
                  }
                />
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG o WebP · máx. 2 MB</p>
              </>
            )}
          </CardContent>
      </Card>}

      {/* Type selector — grid always, interactive in create/register/seller, read-only in edit */}
      {showBusinessIdentity && <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de negocio{isCreateMode && <span className="text-destructive"> *</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
      </Card>}

      {/* Business data */}
      {showBusinessIdentity && <Card>
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
                maxLength={20}
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
            <p className={`text-xs text-right ${values.name.length >= 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {values.name.length}/20
            </p>
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
          {isEdit && defaultValues?.slug && (
            <>
              <Separator />
              <div className="space-y-1">
                <Label className="text-muted-foreground">Store URL</Label>
                <p className="text-sm font-mono py-1 text-primary">catalog.mx/{defaultValues.slug}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>}

      {/* Contact */}
      {showContact && <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreateMode ? (
            <div className="space-y-1.5">
              <Label htmlFor="bfp-contact">
                {mode === 'register' ? 'Tu nombre' : 'Nombre del vendedor'}
                {mode === 'register'
                  ? <span className="text-destructive"> *</span>
                  : <span className="text-muted-foreground font-normal"> (opcional)</span>}
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
              WhatsApp{mode === 'register'
                ? <span className="text-destructive"> *</span>
                : <span className="text-muted-foreground font-normal"> (opcional)</span>}
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
                  Email del vendedor <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="bfp-owner-email"
                  value={values.ownerEmail}
                  onChange={e => setters.setOwnerEmail(e.target.value)}
                  placeholder="dueno@gmail.com"
                  type="email"
                />
                <p className="text-xs text-muted-foreground">
                  Si lo proporcionas, el vendedor quedará activado automáticamente.
                </p>
              </div>
            </>
          )}
          {mode === 'edit' && (
            <>
              <Separator />
              <div className="space-y-1">
                <Label className="text-muted-foreground">Vendedor</Label>
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
      </Card>}

      {/* Location */}
      {showContact && <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bfp-city">
                Ciudad{mode === 'register'
                  ? <span className="text-destructive"> *</span>
                  : <span className="text-muted-foreground font-normal"> (opcional)</span>}
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
              <Label htmlFor="bfp-state">
                Estado{mode === 'register' && <span className="text-destructive"> *</span>}
              </Label>
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
      </Card>}

      {showProducts && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Productos <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductEditor
              businessId=""
              businessSlug={slug}
              scope="draft"
              draftProducts={draftProducts}
              onDraftProductsChange={setDraftProducts}
              uploadPath="/api/v1/business-registration-images"
            />
            {!draftProducts.length && (
              <p className="mt-2 text-xs text-muted-foreground">
                Agrega al menos un producto con nombre, precio, descripción e imagen.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {showConfirmation && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Revisa tu información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={values.logo} alt="" className="h-12 w-12 rounded-xl border border-border object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{values.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {values.city}, {values.state}
                  </p>
                </div>
              </div>
              <Separator />
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Contacto</dt>
                  <dd className="font-medium">{values.contactName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">WhatsApp</dt>
                  <dd className="font-medium">{values.whatsapp}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Productos</dt>
                  <dd className="font-medium">{draftProducts.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Tu enlace</dt>
                  <dd className="truncate font-medium text-primary">catalog.mx/{slug}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={event => setAcceptedTerms(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
            />
            <span className="leading-5 text-muted-foreground">
              Acepto los{' '}
              <a
                href={`${import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'}/${locale}/legal/terms`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-2"
              >
                términos y condiciones
              </a>
              .
            </span>
          </label>
        </>
      )}

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
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {registrationStep > 0 && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => goToStep(registrationStep - 1)}
              >
                Atrás
              </Button>
            )}
            {registrationStep < REGISTRATION_STEPS.length - 1 ? (
              <Button
                type="button"
                className="w-full sm:flex-1"
                onClick={goToNextStep}
              >
                Continuar
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full gap-2 sm:flex-1"
                disabled={isPending || !registerComplete}
              >
                {registrationPending ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Creando tienda...
                  </>
                ) : (
                  'Crear tienda'
                )}
              </Button>
            )}
          </div>
        ) : (
          <Button type="submit" disabled={isPending} className="w-full">
            {mode === 'create'
              ? createStore.isPending ? 'Creando...' : 'Crear negocio'
              : saved ? '✓ Guardado' : savePending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        )
      )}

      {mode === 'register' && (
        <p className="text-xs text-center text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <a href={`${import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'}/${locale}`} className="underline underline-offset-2">
            Inicia sesión
          </a>
        </p>
      )}
    </form>
  )
}
