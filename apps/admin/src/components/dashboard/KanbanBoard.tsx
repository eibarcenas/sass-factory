import { useBusinesses } from '../../hooks/useBusinesses'
import { BusinessStatus, type Business } from '@eguru/core'

const COLUMNS: { status: BusinessStatus; label: string }[] = [
  { status: BusinessStatus.Draft,    label: 'Draft' },
  { status: BusinessStatus.Demo,     label: 'Demo' },
  { status: BusinessStatus.Sent,     label: 'Sent' },
  { status: BusinessStatus.Accepted, label: 'Accepted' },
  { status: BusinessStatus.Active,   label: 'Active' },
]

function KanbanCard({ business, onClick }: { business: Business; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-background rounded-xl border border-border hover:border-foreground/20 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: (business.theme?.primary ?? '#6366f1') + '20' }}
        >
          {business.theme?.emoji ?? '🏪'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {business.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{business.city}</p>
        </div>
      </div>
    </button>
  )
}

export default function KanbanBoard({ onSelectBusiness }: { onSelectBusiness: (b: Business) => void }) {
  const { data, isLoading } = useBusinesses()
  const businesses = data?.businesses ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {COLUMNS.map(col => (
          <div key={col.status} className="space-y-2">
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            {[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {COLUMNS.map(col => {
        const cards = businesses.filter(b => b.status === col.status)
        const isStall = col.status === BusinessStatus.Accepted && cards.length === 0

        return (
          <div key={col.status} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-0.5 mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isStall ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {col.label}
              </span>
              <span className={`text-xs font-bold tabular-nums ${isStall ? 'text-amber-600' : 'text-foreground'}`}>
                {cards.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {cards.map(b => (
                <KanbanCard key={b.id} business={b} onClick={() => onSelectBusiness(b)} />
              ))}

              {cards.length === 0 && (
                <div className={`h-14 rounded-xl border-2 border-dashed flex items-center justify-center ${
                  isStall
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-border'
                }`}>
                  {isStall && <span className="text-xs text-amber-500 font-medium">needs action</span>}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
