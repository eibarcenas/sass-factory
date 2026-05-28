import { useState } from 'react'
import { useProspects } from '../hooks/useProspects'
import KanbanBoard from '../components/dashboard/KanbanBoard'
import CreateDemoForm from '../components/demos/CreateDemoForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Business } from '@eguru/core'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

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
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <span className="text-xl">🎉</span>
          <p className="text-sm font-medium text-green-800">
            {newCount} new prospect{newCount > 1 ? 's' : ''} — reach out now
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : prospects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-3xl mb-2">👥</p>
          <p className="text-sm">No prospects yet — share your demos!</p>
        </div>
      ) : (
        <div className="space-y-0 rounded-2xl border overflow-hidden bg-background">
          {prospects.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <Separator />}
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'new' ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                    <p className="font-medium text-sm">{p.contactName ?? 'Anonymous'}</p>
                    {p.status === 'new' && (
                      <Badge className="bg-green-500 text-white text-xs h-4 px-1.5">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-4">
                    {[p.phone, p.email].filter(Boolean).join(' · ')}
                    {p.businessId && <span className="ml-1">· via <span className="font-mono">{p.businessId}</span></span>}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(p.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {data?.total ?? 0} total · refreshes every 30s
      </p>
    </div>
  )
}

export default function SalesPage({ onSelectBusiness }: { onSelectBusiness: (b: Business) => void }) {
  const [tab, setTab] = useState<'demos' | 'prospects'>('demos')
  const [showForm, setShowForm] = useState(false)
  const { data: prospectData } = useProspects()
  const newCount = prospectData?.prospects.filter(p => p.status === 'new').length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales</h1>
        {tab === 'demos' && (
          <Button size="sm" variant={showForm ? 'ghost' : 'default'} onClick={() => setShowForm(f => !f)}>
            {showForm ? 'Cancel' : '+ New demo'}
          </Button>
        )}
      </div>

      {showForm && tab === 'demos' && (
        <Card>
          <CardContent className="pt-5">
            <CreateDemoForm onSuccess={(slug) => {
              setShowForm(false)
              window.open(`${STOREFRONT_URL}/demo/${slug}`, '_blank')
            }} />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-0 border-b">
        {(['demos', 'prospects'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              tab === t
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'demos' ? 'Demos' : 'Prospects'}
            {t === 'prospects' && newCount > 0 && (
              <Badge className="bg-green-500 text-white text-xs h-4 px-1.5">{newCount}</Badge>
            )}
          </button>
        ))}
      </div>

      {tab === 'demos' && <KanbanBoard onSelectBusiness={onSelectBusiness} />}
      {tab === 'prospects' && <ProspectsTab />}
    </div>
  )
}
