import { useBusinesses } from '../../hooks/useBusinesses'
import { BusinessStatus, type Business } from '@eguru/core'

const COLUMNS: { status: BusinessStatus; label: string; topBorder: string; labelColor: string }[] = [
  { status: BusinessStatus.Draft,    label: 'Borrador',   topBorder: 'border-t-slate-300',   labelColor: 'text-slate-500' },
  { status: BusinessStatus.Demo,     label: 'Demo lista', topBorder: 'border-t-primary',     labelColor: 'text-primary' },
  { status: BusinessStatus.Sent,     label: 'Enviada',    topBorder: 'border-t-amber-400',   labelColor: 'text-amber-600' },
  { status: BusinessStatus.Accepted, label: 'Aceptada',   topBorder: 'border-t-emerald-500', labelColor: 'text-emerald-700' },
  { status: BusinessStatus.Active,   label: 'Activa',     topBorder: 'border-t-emerald-600', labelColor: 'text-emerald-800' },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'justo ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

function KanbanCard({ business, onClick }: { business: Business; onClick: () => void }) {
  const isAccepted = business.status === BusinessStatus.Accepted

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all group ${
        isAccepted
          ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:shadow-sm'
          : 'bg-background border-border hover:border-primary/30 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
          style={{ backgroundColor: (business.theme?.primary ?? '#6366f1') + '20' }}
        >
          {business.theme?.emoji ?? '🏪'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {business.name}
          </p>
          <p className="text-xs text-muted-foreground truncate capitalize">
            {business.type} · {business.city}
          </p>
        </div>
      </div>

      {isAccepted && (
        <div className="mt-2.5 pt-2.5 border-t border-emerald-200 flex items-center justify-between">
          <p className="text-xs text-emerald-700 font-medium">Cliente aceptó la demo</p>
          <span className="text-xs text-primary font-semibold">Activar →</span>
        </div>
      )}

      {!isAccepted && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{timeAgo(business.createdAt)}</span>
          <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Abrir →
          </span>
        </div>
      )}
    </button>
  )
}

export default function KanbanBoard({ onSelectBusiness }: { onSelectBusiness: (b: Business) => void }) {
  const { data, isLoading } = useBusinesses()
  const businesses = data?.businesses ?? []

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map(col => (
          <div key={col.status} className="flex-shrink-0 w-52 space-y-2">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            {[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map(col => {
        const cards = businesses.filter(b => b.status === col.status)

        return (
          <div key={col.status} className="flex-shrink-0 w-52">
            <div className={`rounded-xl border border-border border-t-4 ${col.topBorder} bg-background p-3 flex flex-col gap-2`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${col.labelColor}`}>
                  {col.label}
                </span>
                <span className={`text-xs font-bold tabular-nums ${col.labelColor}`}>
                  {cards.length}
                </span>
              </div>

              {cards.map(b => (
                <KanbanCard key={b.id} business={b} onClick={() => onSelectBusiness(b)} />
              ))}

              {cards.length === 0 && (
                <div className="h-14 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground/50">vacío</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
