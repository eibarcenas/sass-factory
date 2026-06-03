import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useBusinesses, useBusinessAction } from '../../hooks/useBusinesses'
import { BusinessStatus, type Business } from '@eguru/core'

const COLUMNS: { status: BusinessStatus; label: string; topBorder: string; labelColor: string }[] = [
  { status: BusinessStatus.Draft,    label: 'Borrador',   topBorder: 'border-t-slate-300',   labelColor: 'text-slate-500' },
  { status: BusinessStatus.Demo,     label: 'Demo lista', topBorder: 'border-t-primary',     labelColor: 'text-primary' },
  { status: BusinessStatus.Sent,     label: 'Enviada',    topBorder: 'border-t-amber-400',   labelColor: 'text-amber-600' },
  { status: BusinessStatus.Accepted, label: 'Aceptada',   topBorder: 'border-t-emerald-500', labelColor: 'text-emerald-700' },
  { status: BusinessStatus.Active,   label: 'Activa',     topBorder: 'border-t-emerald-600', labelColor: 'text-emerald-800' },
]

// Only forward transitions are supported by the API
const VALID_TRANSITION: Partial<Record<BusinessStatus, { to: BusinessStatus; action: string }>> = {
  [BusinessStatus.Draft]:    { to: BusinessStatus.Demo,     action: 'publish'  },
  [BusinessStatus.Demo]:     { to: BusinessStatus.Sent,     action: 'send'     },
  [BusinessStatus.Sent]:     { to: BusinessStatus.Accepted, action: 'accept'   },
  [BusinessStatus.Accepted]: { to: BusinessStatus.Active,   action: 'activate' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'justo ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

function CardBody({ business }: { business: Business }) {
  const isAccepted = business.status === BusinessStatus.Accepted
  return (
    <>
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
          style={{ backgroundColor: (business.theme?.primary ?? '#6366f1') + '20' }}
        >
          {business.theme?.emoji ?? '🏪'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{business.name}</p>
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
        </div>
      )}
    </>
  )
}

function DraggableCard({ business, onClick, isBeingDragged }: {
  business: Business
  onClick: () => void
  isBeingDragged: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: business.id })
  const isAccepted = business.status === BusinessStatus.Accepted

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`touch-none transition-opacity ${isBeingDragged ? 'opacity-30' : 'opacity-100'}`}
    >
      <button
        onClick={onClick}
        className={`w-full text-left p-3 rounded-xl border transition-all group cursor-grab active:cursor-grabbing ${
          isAccepted
            ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:shadow-sm'
            : 'bg-background border-border hover:border-primary/30 hover:shadow-sm'
        }`}
      >
        <CardBody business={business} />
      </button>
    </div>
  )
}

function DroppableColumn({ col, cards, isOver, canDrop, onSelectBusiness, draggingId }: {
  col: typeof COLUMNS[number]
  cards: Business[]
  isOver: boolean
  canDrop: boolean
  onSelectBusiness: (b: Business) => void
  draggingId: string | null
}) {
  const { setNodeRef } = useDroppable({ id: col.status })

  const columnClass = isOver && canDrop
    ? 'border-primary/40 bg-primary/5'
    : isOver && !canDrop
    ? 'border-destructive/30 bg-destructive/5'
    : 'border-border'

  return (
    <div className="flex-shrink-0 w-52">
      <div
        ref={setNodeRef}
        className={`rounded-xl border border-t-4 ${col.topBorder} ${columnClass} bg-background p-3 flex flex-col gap-2 transition-colors min-h-[120px]`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${col.labelColor}`}>
            {col.label}
          </span>
          <span className={`text-xs font-bold tabular-nums ${col.labelColor}`}>
            {cards.length}
          </span>
        </div>

        {cards.map(b => (
          <DraggableCard
            key={b.id}
            business={b}
            onClick={() => onSelectBusiness(b)}
            isBeingDragged={b.id === draggingId}
          />
        ))}

        {cards.length === 0 && (
          <div className={`h-14 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${
            isOver && canDrop ? 'border-primary/50' : 'border-border/60'
          }`}>
            <span className="text-xs text-muted-foreground/50">
              {isOver && canDrop ? 'Soltar aquí' : 'vacío'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function OverlayCard({ business }: { business: Business }) {
  const isAccepted = business.status === BusinessStatus.Accepted
  return (
    <div className={`w-52 p-3 rounded-xl border shadow-xl rotate-2 cursor-grabbing ${
      isAccepted
        ? 'bg-emerald-50 border-emerald-300'
        : 'bg-background border-primary/40'
    }`}>
      <CardBody business={business} />
    </div>
  )
}

export default function KanbanBoard({ onSelectBusiness }: { onSelectBusiness: (b: Business) => void }) {
  const { data, isLoading } = useBusinesses()
  const action = useBusinessAction()
  const businesses = data?.businesses ?? []

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<BusinessStatus | null>(null)

  const draggingBusiness = draggingId ? businesses.find(b => b.id === draggingId) : null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function canDrop(fromStatus: BusinessStatus, toStatus: BusinessStatus) {
    return VALID_TRANSITION[fromStatus]?.to === toStatus
  }

  function handleDragStart({ active }: DragStartEvent) {
    setDraggingId(active.id as string)
  }

  function handleDragOver({ over }: { over: { id: unknown } | null }) {
    setOverId((over?.id as BusinessStatus) ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggingId(null)
    setOverId(null)
    if (!over) return

    const business = businesses.find(b => b.id === active.id)
    if (!business) return

    const targetStatus = over.id as BusinessStatus
    if (targetStatus === business.status) return

    const transition = VALID_TRANSITION[business.status]
    if (!transition || transition.to !== targetStatus) return

    action.mutate({ id: business.id, action: transition.action })
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 overscroll-x-contain">
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2 overscroll-x-contain">
        {COLUMNS.map(col => {
          const cards = businesses.filter(b => b.status === col.status)
          const isOver = overId === col.status
          const dropAllowed = draggingBusiness ? canDrop(draggingBusiness.status, col.status) : false

          return (
            <DroppableColumn
              key={col.status}
              col={col}
              cards={cards}
              isOver={isOver}
              canDrop={dropAllowed}
              onSelectBusiness={onSelectBusiness}
              draggingId={draggingId}
            />
          )
        })}
      </div>

      <DragOverlay>
        {draggingBusiness ? <OverlayCard business={draggingBusiness} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
