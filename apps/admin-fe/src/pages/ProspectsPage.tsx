import { useProspects } from '../hooks/useProspects'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function ProspectsPage() {
  const { data, isLoading } = useProspects()
  const prospects = data?.prospects ?? []
  const newCount = prospects.filter(p => p.status === 'new').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prospects</h1>
        <p className="text-muted-foreground text-sm mt-1">
          People who requested a store
        </p>
      </div>

      {newCount > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-green-800">{newCount} new prospect{newCount > 1 ? 's' : ''}!</p>
            <p className="text-sm text-green-600">Someone wants a store — reach out now.</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            All prospects
            <Badge variant="secondary">{data?.total ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm">No prospects yet — share your stores!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {prospects.map((p, i) => (
                <div key={p.id}>
                  {i > 0 && <Separator />}
                  <div className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{p.contactName ?? 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.phone && <span>{p.phone} · </span>}
                        {p.email && <span>{p.email} · </span>}
                        <span className="font-mono text-xs">{p.businessId}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.status === 'new' && (
                        <Badge className="bg-green-500 text-white text-xs">New</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{timeAgo(p.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
