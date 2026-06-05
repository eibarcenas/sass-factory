import { useRequests, useUpdateRequestStatus } from '../../hooks/useRequests'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CatalogRequest, RequestStatus } from '@eguru/core'

const STATUS_CONFIG: Record<RequestStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending:   { label: 'Pendiente',   variant: 'outline' },
  reviewing: { label: 'En revisión', variant: 'secondary' },
  approved:  { label: 'Aprobado',    variant: 'default' },
}

const STATUS_ORDER: RequestStatus[] = ['pending', 'reviewing', 'approved']

function RequestCard({ request }: { request: CatalogRequest }) {
  const update = useUpdateRequestStatus()

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-mono text-muted-foreground">#{request.hash}</CardTitle>
          <Badge variant={STATUS_CONFIG[request.status]?.variant ?? 'outline'}>
            {STATUS_CONFIG[request.status]?.label ?? request.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(request.created_at).toLocaleString('es-MX')}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {request.items.map(item => (
            <div key={item.product_id} className="flex items-center justify-between text-sm">
              <span>{item.product_name} × {item.quantity}</span>
              {typeof item.total === 'number' && (
                <span className="font-medium">${item.total.toLocaleString('es-MX')}</span>
              )}
            </div>
          ))}
        </div>

        {typeof request.total === 'number' && (
          <div className="flex items-center justify-between border-t pt-2 font-bold text-sm">
            <span>Total</span>
            <span>${request.total.toLocaleString('es-MX')} MXN</span>
          </div>
        )}

        {request.customer_message && (
          <div className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
            {request.customer_message}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-3">
          {STATUS_ORDER.map(s => (
            <Button
              key={s}
              size="sm"
              variant={request.status === s ? 'default' : 'outline'}
              disabled={request.status === s || update.isPending}
              onClick={() => update.mutate({ hash: request.hash, status: s })}
            >
              {STATUS_CONFIG[s].label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SellerRequestsPage() {
  const { data, isLoading, isError } = useRequests()

  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">Cargando solicitudes…</div>
    )
  }

  if (isError) {
    return (
      <div className="py-10 text-center text-sm text-destructive">
        No se pudieron cargar las solicitudes.
      </div>
    )
  }

  const requests = data?.requests ?? []

  if (!requests.length) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Aún no tienes solicitudes de cotización.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map(r => (
        <RequestCard key={r.hash} request={r} />
      ))}
    </div>
  )
}
