import { useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useBusinesses, useBusinessAction } from '../hooks/useBusinesses'
import ProductEditor from '../components/demos/ProductEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BusinessStatus } from '@eguru/core'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

const PIPELINE_STEPS: { status: BusinessStatus; label: string; desc: string }[] = [
  { status: BusinessStatus.Draft,    label: 'Borrador',   desc: 'Página en preparación' },
  { status: BusinessStatus.Demo,     label: 'Demo lista', desc: 'Lista para compartir con el cliente' },
  { status: BusinessStatus.Sent,     label: 'Enviada',    desc: 'El cliente recibió el link' },
  { status: BusinessStatus.Accepted, label: 'Aceptada',   desc: 'El cliente quiere activar su cuenta' },
  { status: BusinessStatus.Active,   label: 'Activa',     desc: 'Negocio en vivo en catalog.mx' },
]

const NEXT_ACTION: Partial<Record<BusinessStatus, { label: string; verb: string }>> = {
  [BusinessStatus.Draft]:    { label: 'Publicar demo',        verb: 'publish' },
  [BusinessStatus.Demo]:     { label: 'Marcar como enviada',  verb: 'send' },
  [BusinessStatus.Sent]:     { label: 'Marcar como aceptada', verb: 'accept' },
  [BusinessStatus.Accepted]: { label: 'Activar cuenta →',     verb: 'activate' },
  [BusinessStatus.Active]:   { label: 'Suspender',            verb: 'suspend' },
}

const TYPE_LABELS: Record<string, string> = {
  heladeria:   'Heladería',
  barberia:    'Barbería',
  estetica:    'Estética',
  restaurante: 'Restaurante',
  panaderia:   'Panadería',
  gym:         'Gimnasio',
  mecanico:    'Mecánico',
  otro:        'Otro',
}

function PipelineProgress({ status }: { status: BusinessStatus }) {
  const currentIdx = PIPELINE_STEPS.findIndex(s => s.status === status)

  return (
    <div className="space-y-0">
      {PIPELINE_STEPS.map(({ status: s, label, desc }, idx) => {
        const isCompleted = idx < currentIdx
        const isCurrent   = idx === currentIdx
        const isLast      = idx === PIPELINE_STEPS.length - 1

        return (
          <div key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-colors ${
                isCurrent
                  ? 'bg-primary border-primary text-primary-foreground'
                  : isCompleted
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-background border-border text-muted-foreground'
              }`}>
                {isCompleted ? <Check size={11} strokeWidth={2.5} /> : idx + 1}
              </div>
              {!isLast && (
                <div className={`w-0.5 h-7 mt-1 ${isCompleted ? 'bg-primary/30' : 'bg-border'}`} />
              )}
            </div>
            <div className={`${isLast ? 'pb-0' : 'pb-6'}`}>
              <p className={`text-sm font-medium leading-tight ${isCurrent ? 'text-foreground' : isCompleted ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                {label}
              </p>
              {(isCurrent || isCompleted) && (
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

export default function DemoDetailPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const action = useBusinessAction()

  const { data, isLoading } = useBusinesses()
  const business = data?.businesses.find(b => b.id === businessId)

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-16 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-medium">Demo no encontrada</p>
        <button onClick={() => navigate('/clientes')} className="mt-4 text-sm text-primary hover:underline">
          Volver a Clientes
        </button>
      </div>
    )
  }

  const next = NEXT_ACTION[business.status]
  const typeLabel = TYPE_LABELS[business.type] ?? business.type

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate('/clientes')}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-5 transition-colors"
        >
          ← Volver a clientes
        </button>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: (business.theme?.primary ?? '#6366f1') + '20' }}
          >
            {business.theme?.emoji ?? '🏪'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <p className="text-sm text-muted-foreground">{business.city} · {typeLabel}</p>
          </div>
        </div>
      </div>

      {/* Two-column grid: info + progress */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Información del negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <InfoRow label="Nicho" value={typeLabel} />
            <InfoRow label="Ciudad" value={business.city} />
            <InfoRow label="WhatsApp" value={
              <span className="font-mono text-xs">{business.whatsapp}</span>
            } />
            <InfoRow label="Dueño" value={
              business.ownerId
                ? <span className="text-emerald-600 text-xs font-medium">Registrado</span>
                : <span className="text-muted-foreground text-xs">Sin asignar</span>
            } />
            {business.tagline && (
              <div className="pt-3 pb-1">
                <p className="text-xs text-muted-foreground mb-1">Tagline</p>
                <p className="text-sm italic text-foreground">"{business.tagline}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineProgress status={business.status} />
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos / Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductEditor businessId={business.id} businessSlug={business.slug} />
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <a href={`${STOREFRONT_URL}/demo/${business.slug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">Ver demo ↗</Button>
        </a>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/owner/preview/${business.slug}`)}
        >
          Ver panel del cliente
        </Button>
        {next && (
          <Button
            size="sm"
            disabled={action.isPending}
            onClick={() => action.mutate({ id: business.id, action: next.verb })}
            className="ml-auto"
          >
            {next.label}
          </Button>
        )}
      </div>
    </div>
  )
}
