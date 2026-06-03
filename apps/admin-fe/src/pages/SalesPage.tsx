import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProspects } from '../hooks/useProspects'
import { useBusinesses } from '../hooks/useBusinesses'
import KanbanBoard from '../components/dashboard/KanbanBoard'
import SolicitudesList from '../components/demos/SolicitudesList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BusinessStatus, type Business } from '@eguru/core'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function ProspectsTab() {
  const { data, isLoading } = useProspects()
  const prospects = data?.prospects ?? []
  const newCount = prospects.filter(p => p.status === 'new').length

  return (
    <div className="space-y-4">
      {newCount > 0 && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
          <span className="text-xl">🎉</span>
          <p className="text-sm font-medium text-foreground">
            {newCount} prospecto{newCount > 1 ? 's' : ''} nuevo{newCount > 1 ? 's' : ''} — contacta ahora
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : prospects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-medium text-sm">Sin prospectos todavía</p>
          <p className="text-xs mt-1">Comparte tus demos para que lleguen.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-background">
          {prospects.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <Separator />}
              <div className="px-4 py-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'new' ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <p className="font-medium text-sm">{p.contactName ?? 'Anónimo'}</p>
                    {p.status === 'new' && (
                      <Badge className="text-[10px] h-4 px-1.5">Nuevo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-4">
                    {[p.phone, p.email].filter(Boolean).join(' · ')}
                    {p.businessId && (
                      <span className="ml-1 text-muted-foreground/70">· via <span className="font-mono">{p.businessId}</span></span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{timeAgo(p.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {data?.total ?? 0} total · actualiza c/30s
      </p>
    </div>
  )
}

export default function SalesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'solicitudes' | 'demos' | 'prospects'>('solicitudes')
  const { data: prospectData } = useProspects()
  const { data: solicitudesData } = useBusinesses(BusinessStatus.Review)
  const newCount = prospectData?.prospects.filter(p => p.status === 'new').length ?? 0
  const solicitudesCount = solicitudesData?.total ?? 0

  function handleSelectBusiness(b: Business) {
    navigate(`/clientes/${b.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        {tab === 'demos' && (
          <Button size="sm" onClick={() => navigate('/clientes/new')}>
            + Nueva demo
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        <button
          onClick={() => setTab('solicitudes')}
          className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            tab === 'solicitudes'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Solicitudes
          {solicitudesCount > 0 && (
            <Badge className="text-[10px] h-4 px-1.5 bg-blue-600">{solicitudesCount}</Badge>
          )}
        </button>
        <button
          onClick={() => setTab('demos')}
          className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            tab === 'demos'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Demos
        </button>
        <button
          onClick={() => setTab('prospects')}
          className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            tab === 'prospects'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Prospectos
          {newCount > 0 && (
            <Badge className="text-[10px] h-4 px-1.5">{newCount}</Badge>
          )}
        </button>
      </div>

      {tab === 'solicitudes' && <SolicitudesList />}
      {tab === 'demos' && <KanbanBoard onSelectBusiness={handleSelectBusiness} />}
      {tab === 'prospects' && <ProspectsTab />}
    </div>
  )
}
