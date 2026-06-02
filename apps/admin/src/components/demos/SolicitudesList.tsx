import { useBusinesses, useBusinessAction } from '../../hooks/useBusinesses'
import { BusinessStatus } from '@eguru/core'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'justo ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

export default function SolicitudesList() {
  const { data, isLoading } = useBusinesses(BusinessStatus.Review)
  const action = useBusinessAction()

  const solicitudes = data?.businesses ?? []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (solicitudes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-medium text-sm">Sin solicitudes pendientes</p>
        <p className="text-xs mt-1">Cuando un negocio envíe su catálogo para revisión aparecerá aquí.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
        <span className="text-xl">📋</span>
        <p className="text-sm font-medium text-blue-900">
          {solicitudes.length} catálogo{solicitudes.length > 1 ? 's' : ''} esperando revisión
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-background">
        {solicitudes.map((biz, i) => (
          <div key={biz.id}>
            {i > 0 && <Separator />}
            <div className="px-4 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{biz.name}</p>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">
                    {biz.type}
                  </Badge>
                  {biz.ownerEmail && (
                    <span className="text-xs text-muted-foreground">{biz.ownerEmail}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enviado {biz.submittedAt ? timeAgo(biz.submittedAt) : timeAgo(biz.updatedAt)}
                  {biz.city ? ` · ${biz.city}` : ''}
                </p>
                {biz.ownerApprovedAt && (
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">
                    Owner aprobó ✓
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`${STOREFRONT_URL}/demo/${biz.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Ver catálogo
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5 h-7 px-2.5 text-xs"
                  disabled={action.isPending}
                  onClick={() => action.mutate({ id: biz.id, action: 'archive' })}
                >
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  disabled={action.isPending}
                  onClick={() => action.mutate({ id: biz.id, action: 'activate' })}
                >
                  Activar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
