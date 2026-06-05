import { useNavigate, useParams } from 'react-router-dom'
import { useImpersonationStore } from '../store/impersonation'
import { useBusinesses, useBusinessAction } from '../hooks/useBusinesses'
import ProductEditor from '../components/catalog/ProductEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '../components/ui/StatusBadge'
import { BusinessStatus } from '@eguru/core'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

export default function ClientDetailPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const { startImpersonation } = useImpersonationStore()
  const action = useBusinessAction()

  const { data, isLoading } = useBusinesses()
  const business = data?.businesses.find(b => b.id === businessId)

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-16 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <p className="font-medium">Negocio no encontrado</p>
        <button onClick={() => navigate('/clientes')} className="mt-4 text-sm text-primary hover:underline">
          Volver a Clientes
        </button>
      </div>
    )
  }

  const typeLabel = TYPE_LABELS[business.type] ?? business.type
  const canActivate   = business.status === BusinessStatus.Pending || business.status === BusinessStatus.Inactive
  const canDeactivate = business.status === BusinessStatus.Active

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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold truncate">{business.name}</h1>
              <StatusBadge status={business.status} />
            </div>
            <p className="text-sm text-muted-foreground">{business.city} · {typeLabel}</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Información del negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <InfoRow label="Nicho" value={typeLabel} />
          <InfoRow label="Ciudad" value={
            business.state ? `${business.city}, ${business.state}` : business.city
          } />
          <InfoRow label="WhatsApp" value={
            <span className="font-mono text-xs">{business.whatsapp}</span>
          } />
          {business.contactName && (
            <InfoRow label="Contacto" value={business.contactName} />
          )}
          <InfoRow label="Dueño" value={
            business.ownerEmail
              ? <span className="text-emerald-600 text-xs font-medium">{business.ownerEmail}</span>
              : business.ownerId
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
      <div className="flex flex-wrap items-center gap-3">
        <a href={`${STOREFRONT_URL}/demo/${business.slug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">Ver sitio ↗</Button>
        </a>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/owner/preview/${business.slug}`)}
        >
          Ver panel del cliente
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { startImpersonation(business.slug, business.name); navigate('/owner') }}
        >
          Act as Owner
        </Button>
        {canActivate && (
          <Button
            size="sm"
            disabled={action.isPending}
            onClick={() => action.mutate({ id: business.id, action: business.status === BusinessStatus.Inactive ? 'reactivate' : 'activate' })}
            className="ml-auto"
          >
            Activar cuenta →
          </Button>
        )}
        {canDeactivate && (
          <Button
            size="sm"
            variant="outline"
            disabled={action.isPending}
            onClick={() => action.mutate({ id: business.id, action: 'deactivate' })}
            className="ml-auto text-destructive hover:text-destructive"
          >
            Desactivar
          </Button>
        )}
      </div>
    </div>
  )
}
