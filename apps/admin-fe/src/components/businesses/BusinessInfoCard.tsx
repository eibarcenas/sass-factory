import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { BusinessType, BusinessStatus } from '@eguru/core'
import type { BusinessTheme } from '@eguru/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/ui/StatusBadge'
import ImageUpload from '@/components/catalog/ImageUpload'

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

export const TYPE_LABELS: Record<string, string> = {
  heladeria: 'Heladería', barberia: 'Barbería', estetica: 'Estética',
  restaurante: 'Restaurante', panaderia: 'Panadería', gym: 'Gimnasio',
  mecanico: 'Mecánico', otro: 'Otro',
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function BusinessAvatar({ logo, theme, size = 'md' }: {
  logo?: string
  theme?: BusinessTheme
  size?: 'sm' | 'md' | 'lg'
}) {
  const sz = size === 'sm' ? 'w-10 h-10 text-xl' : size === 'lg' ? 'w-20 h-20 text-4xl' : 'w-14 h-14 text-2xl'
  if (logo) {
    return <img src={logo} alt="" className={`${sz} rounded-xl object-cover flex-shrink-0`} />
  }
  return (
    <div
      className={`${sz} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: (theme?.primary ?? '#6366f1') + '20' }}
    >
      {theme?.emoji ?? '🏪'}
    </div>
  )
}

export interface BusinessData {
  logo?: string
  type?: BusinessType
  name: string
  whatsapp?: string
  city?: string
  state?: string
  tagline?: string
  theme?: BusinessTheme
  status: BusinessStatus
  ownerId?: string
  ownerEmail?: string
  contactName?: string
}

interface Props {
  business: BusinessData
  editable?: boolean
  readonly?: boolean
  showAdminFields?: boolean
  impersonateSlug?: string
  onSaved?: () => void
}

export default function BusinessInfoCard({
  business,
  editable = false,
  readonly = false,
  showAdminFields = false,
  impersonateSlug,
  onSaved,
}: Props) {
  const qc = useQueryClient()
  const typeLabel = TYPE_LABELS[business.type ?? ''] ?? business.type ?? '—'

  // ── Edit form state ──────────────────────────────────────────────────────────
  const [logo,     setLogo]     = useState(business.logo ?? '')
  const [type,     setType]     = useState<BusinessType | ''>(business.type ?? '')
  const [name,     setName]     = useState(business.name)
  const [whatsapp, setWhatsapp] = useState(business.whatsapp ?? '')
  const [city,     setCity]     = useState(business.city ?? '')
  const [state,    setState]    = useState(business.state ?? 'Ciudad de México')
  const [tagline,  setTagline]  = useState(business.tagline ?? '')
  const [saved,    setSaved]    = useState(false)

  useEffect(() => { setLogo(business.logo ?? '') },       [business.logo])
  useEffect(() => { setType(business.type ?? '') },        [business.type])
  useEffect(() => { setName(business.name) },              [business.name])
  useEffect(() => { setWhatsapp(business.whatsapp ?? '') }, [business.whatsapp])
  useEffect(() => { setCity(business.city ?? '') },         [business.city])
  useEffect(() => { setState(business.state ?? 'Ciudad de México') }, [business.state])
  useEffect(() => { setTagline(business.tagline ?? '') },   [business.tagline])

  const qs = impersonateSlug ? `?business=${impersonateSlug}` : ''
  const save = useMutation({
    mutationFn: () => api.patch(`/api/v1/owner/business${qs}`, {
      logo: logo || undefined,
      type: type || undefined,
      name,
      whatsapp: whatsapp || undefined,
      city: city || undefined,
      state: state || undefined,
      tagline: tagline || undefined,
    }),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      qc.invalidateQueries({ queryKey: ['owner-business'] })
      onSaved?.()
    },
  })

  // ── Read-only view ───────────────────────────────────────────────────────────
  if (!editable || readonly) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BusinessAvatar logo={business.logo} theme={business.theme} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{business.name}</h1>
              <StatusBadge status={business.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {[business.city, typeLabel].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {/* Info card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Información del negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <InfoRow label="Nicho" value={typeLabel} />
            <InfoRow label="Ciudad" value={
              business.state ? `${business.city}, ${business.state}` : (business.city ?? '—')
            } />
            <InfoRow label="WhatsApp" value={
              business.whatsapp
                ? <span className="font-mono text-xs">{business.whatsapp}</span>
                : <span className="text-muted-foreground text-xs">Sin número</span>
            } />
            {business.contactName && (
              <InfoRow label="Contacto" value={business.contactName} />
            )}
            {showAdminFields && (
              <InfoRow label="Dueño" value={
                business.ownerEmail
                  ? <span className="text-emerald-600 text-xs font-medium">{business.ownerEmail}</span>
                  : business.ownerId
                    ? <span className="text-emerald-600 text-xs font-medium">Registrado</span>
                    : <span className="text-muted-foreground text-xs">Sin asignar</span>
              } />
            )}
            {business.tagline && (
              <div className="pt-3 pb-1">
                <p className="text-xs text-muted-foreground mb-1">Tagline</p>
                <p className="text-sm italic text-foreground">"{business.tagline}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Editable form ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mi negocio</h1>
        <p className="text-muted-foreground text-sm mt-1">Edita la información de tu catálogo</p>
      </div>

      {/* Logo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <BusinessAvatar logo={logo} theme={business.theme} size="lg" />
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

      {/* Type */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de negocio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map(t => (
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
            <Label htmlFor="bic-name">Nombre del negocio</Label>
            <Input id="bic-name" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del negocio" />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="bic-tagline">
              Tagline <span className="text-muted-foreground font-normal">({tagline.length}/120)</span>
            </Label>
            <Input
              id="bic-tagline"
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
        <CardContent className="space-y-1.5">
          <Label htmlFor="bic-wa">WhatsApp</Label>
          <Input
            id="bic-wa"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value.replace(/[^\d+]/g, ''))}
            placeholder="+52 55 1234 5678"
            type="tel"
          />
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
              <Label htmlFor="bic-city">Ciudad</Label>
              <Input id="bic-city" value={city} onChange={e => setCity(e.target.value)} placeholder="Ej. Monterrey" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bic-state">Estado</Label>
              <select
                id="bic-state"
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

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
        {saved ? '✓ Guardado' : save.isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </div>
  )
}
