import { useNavigate, useParams } from 'react-router-dom'
import { useImpersonationStore } from '../store/impersonation'
import { useBusinesses, useBusinessAction } from '../hooks/useBusinesses'
import ProductEditor from '../components/catalog/ProductEditor'
import BusinessFormPanel from '../components/businesses/BusinessFormPanel'
import StatusBadge from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BusinessStatus } from '@eguru/core'
import { TYPE_LABELS } from '../components/businesses/businessFormConstants'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

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

  const canActivate   = business.status === BusinessStatus.Pending || business.status === BusinessStatus.Inactive
  const canDeactivate = business.status === BusinessStatus.Active
  const typeLabel     = TYPE_LABELS[business.type ?? ''] ?? business.type ?? '—'

  return (
    <div className="space-y-6">
      {/* Header + form — same max-width as /clientes/new */}
      <div className="max-w-xl space-y-6">
        <div>
          <button
            onClick={() => navigate('/clientes')}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-3 transition-colors"
          >
            ← Volver a clientes
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <StatusBadge status={business.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[business.city, typeLabel].filter(Boolean).join(' · ')}
          </p>
        </div>

        <BusinessFormPanel
          mode="edit"
          businessSlug={business.id}
          defaultValues={business}
        />
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
