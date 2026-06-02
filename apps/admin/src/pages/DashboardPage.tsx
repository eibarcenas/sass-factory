import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, Plus } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useSignOut } from '../hooks/useSignOut'
import { useProspects } from '../hooks/useProspects'
import { useBusinesses } from '../hooks/useBusinesses'
import AppSidebar, { SidebarProfile } from '../components/layout/AppSidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessStatus } from '@eguru/core'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, highlight, loading }: {
  label: string
  value: number
  highlight?: boolean
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5">
        {loading ? (
          <div className="h-9 w-10 bg-muted rounded animate-pulse mb-1" />
        ) : (
          <div className="flex items-end gap-1.5">
            <span className={`text-3xl font-bold tabular-nums leading-none ${highlight && value > 0 ? 'text-primary' : 'text-foreground'}`}>
              {value}
            </span>
            {highlight && value > 0 && (
              <span className="w-2 h-2 rounded-full bg-primary mb-1 shrink-0" />
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
      </CardContent>
    </Card>
  )
}

// ── Dashboard content (rendered at /dashboard) ────────────────────────────────

export function DashboardContent() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: bizData, isLoading } = useBusinesses()
  const { data: prospectData } = useProspects()

  const businesses = bizData?.businesses ?? []
  const total = businesses.length
  const readyCount = businesses.filter(b => b.status === BusinessStatus.Demo).length
  const activeCount = businesses.filter(b => b.status === BusinessStatus.Active).length
  const newProspects = prospectData?.prospects.filter(p => p.status === 'new').length ?? 0

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? ''
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'

  const recent = [...businesses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {newProspects > 0
              ? `Tienes ${newProspects} prospecto${newProspects > 1 ? 's' : ''} nuevo${newProspects > 1 ? 's' : ''} esperando.`
              : 'Todo en orden.'}
          </p>
        </div>
        <Button onClick={() => navigate('/clientes')} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva demo
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total demos" value={total} loading={isLoading} />
        <MetricCard label="Demo lista" value={readyCount} loading={isLoading} />
        <MetricCard label="Activas" value={activeCount} loading={isLoading} />
        <MetricCard label="Prospectos nuevos" value={newProspects} highlight loading={isLoading} />
      </div>

      {/* Recent activity */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : recent.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y divide-border">
            {recent.map(b => (
              <div key={b.id} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: (b.theme?.primary ?? '#6366f1') + '20' }}
                >
                  {b.theme?.emoji ?? '🏪'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{b.name}</span>
                  <span className="text-muted-foreground text-sm"> · {b.city}</span>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0 capitalize">{b.status}</Badge>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(b.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">✨</p>
          <p className="font-medium">No hay demos todavía</p>
          <p className="text-sm mt-1">Crea tu primera demo para empezar.</p>
        </div>
      )}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/dashboard' },
  { key: 'clientes',  icon: <Users size={16} />,           label: 'Clientes',  path: '/clientes' },
  { key: 'ajustes',   icon: <Settings size={16} />,        label: 'Ajustes',   path: '/ajustes' },
] as const

type NavKey = typeof NAV_ITEMS[number]['key']

function AdminSidebar({ newProspects, onSignOut }: { newProspects: number; onSignOut: () => void }) {
  const { user, mockMode } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const active: NavKey = location.pathname.startsWith('/clientes')
    ? 'clientes'
    : location.pathname.startsWith('/ajustes')
    ? 'ajustes'
    : 'dashboard'

  const nav = NAV_ITEMS.map(n => ({
    key: n.key,
    icon: n.icon,
    label: n.label,
    badge: n.key === 'clientes' ? newProspects : undefined,
  }))

  return (
    <AppSidebar
      nav={nav}
      active={active}
      onNavigate={(key) => {
        const item = NAV_ITEMS.find(n => n.key === key)
        if (item) navigate(item.path)
      }}
      headerSlot={mockMode && <Badge variant="secondary" className="text-[10px] px-1.5 h-4">mock</Badge>}
      footerSlot={
        <SidebarProfile
          email={user?.email ?? null}
          displayName={user?.displayName}
          photoURL={user?.photoURL}
          role="Admin"
          onSignOut={onSignOut}
        />
      }
    />
  )
}

// ── Admin layout (wraps all admin routes) ─────────────────────────────────────

export default function AdminLayout() {
  const handleSignOut = useSignOut()
  const { data: prospectData } = useProspects()
  const newProspects = prospectData?.prospects.filter(p => p.status === 'new').length ?? 0

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <AdminSidebar newProspects={newProspects} onSignOut={handleSignOut} />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
