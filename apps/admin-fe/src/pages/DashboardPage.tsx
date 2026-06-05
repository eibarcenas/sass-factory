import { useState } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { LayoutDashboard, Users, Plus, Menu } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useProspects } from '../hooks/useProspects'
import { useBusinesses } from '../hooks/useBusinesses'
import AppSidebar, { SidebarProfile } from '../components/layout/AppSidebar'
import { MobileSidebar } from '@eguru/ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessStatus } from '@eguru/core'
import { isLocale, routes } from '@/lib/routes'

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

function MetricCard({ label, value, highlight, loading, onClick }: {
  label: string
  value: number
  highlight?: boolean
  loading?: boolean
  onClick?: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className={onClick ? 'cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]' : ''}
    >
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
  const { locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : 'es'
  const { data: bizData, isLoading } = useBusinesses()
  const { data: prospectData } = useProspects()

  const businesses = bizData?.businesses ?? []
  const total = businesses.length
  const pendingCount = businesses.filter(b => b.status === BusinessStatus.Pending).length
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
        <Button onClick={() => navigate(routes.platformBusinessNew(locale))} className="shrink-0 self-start">
          <Plus className="w-4 h-4 mr-1.5" />
          Nuevo negocio
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total negocios" value={total} loading={isLoading} onClick={() => navigate(routes.platformBusinesses(locale))} />
        <MetricCard label="Pendientes" value={pendingCount} loading={isLoading} highlight onClick={() => navigate(routes.platformBusinesses(locale))} />
        <MetricCard label="Activas" value={activeCount} loading={isLoading} onClick={() => navigate(routes.platformBusinesses(locale))} />
        <MetricCard label="Prospectos nuevos" value={newProspects} highlight loading={isLoading} onClick={() => navigate(routes.platformBusinesses(locale))} />
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
              <button
                key={b.id}
                onClick={() => navigate(routes.platformBusiness(locale, b.id))}
                className="w-full py-3 flex items-center gap-3 first:pt-0 last:pb-0 text-left hover:bg-muted/50 active:bg-muted -mx-6 px-6 transition-colors rounded-lg"
              >
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
              </button>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">✨</p>
          <p className="font-medium">No hay negocios todavía</p>
          <p className="text-sm mt-1">Crea el primer negocio para empezar.</p>
        </div>
      )}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
  { key: 'businesses', icon: <Users size={16} />, label: 'Businesses' },
] as const

type NavKey = typeof NAV_ITEMS[number]['key']

function AdminSidebar({ pendingCount, onAfterNavigate }: { pendingCount: number; onAfterNavigate?: () => void }) {
  const { user, mockMode } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const localeParam = location.pathname.split('/')[1]
  const locale = isLocale(localeParam) ? localeParam : 'es'

  const active: NavKey = location.pathname.includes('/platform/businesses')
    ? 'businesses'
    : 'dashboard'

  const nav = NAV_ITEMS.map(n => ({
    key: n.key,
    icon: n.icon,
    label: n.label,
    badge: n.key === 'businesses' ? pendingCount : undefined,
  }))

  return (
    <AppSidebar
      nav={nav}
      active={active}
      onNavigate={(key) => {
        navigate(key === 'dashboard' ? routes.platformDashboard(locale) : routes.platformBusinesses(locale))
      }}
      onAfterNavigate={onAfterNavigate}
      headerSlot={mockMode && <Badge variant="secondary" className="text-[10px] px-1.5 h-4">mock</Badge>}
      footerSlot={
        <SidebarProfile
          email={user?.email ?? null}
          displayName={user?.displayName}
          photoURL={user?.photoURL}
          role="Admin"
          onSettings={() => navigate(routes.platformProfile(locale))}
        />
      }
    />
  )
}

// ── Admin layout (wraps all admin routes) ─────────────────────────────────────

export default function AdminLayout() {
  const { data: bizData } = useBusinesses()
  const pendingCount = (bizData?.businesses ?? []).filter(b => b.status === BusinessStatus.Pending).length
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full">
        <AdminSidebar pendingCount={pendingCount} />
      </div>

      {/* Mobile drawer */}
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)}>
        <AdminSidebar
          pendingCount={pendingCount}
          onAfterNavigate={() => setMobileSidebarOpen(false)}
        />
      </MobileSidebar>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-30">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm text-primary">catalog.mx</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
