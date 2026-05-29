import { useState } from 'react'
import { LayoutDashboard, Users, Settings, Plus } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useProspects } from '../hooks/useProspects'
import { useBusinesses } from '../hooks/useBusinesses'
import AppSidebar, { SidebarProfile } from '../components/layout/AppSidebar'
import type { NavItem } from '../components/layout/AppSidebar'
import SalesPage from './SalesPage'
import DemoDetailPage from './DemoDetailPage'
import SettingsPage from './settings/SettingsPage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessStatus, type Business } from '@eguru/core'

type Page = 'dashboard' | 'sales' | 'demo-detail' | 'settings'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

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

function DashboardContent({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { user } = useAuthStore()
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
    <div className="space-y-8 max-w-4xl">
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
        <Button onClick={() => onNavigate('sales')} className="shrink-0">
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

function AdminSidebar({ active, onNavigate, newProspects }: {
  active: Page
  onNavigate: (p: Page) => void
  newProspects: number
}) {
  const { user, mockMode } = useAuthStore()

  const nav: NavItem<Page>[] = [
    { key: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { key: 'sales',     icon: <Users size={16} />,           label: 'Clientes', badge: newProspects },
    { key: 'settings',  icon: <Settings size={16} />,        label: 'Ajustes' },
  ]

  return (
    <AppSidebar
      nav={nav}
      active={active}
      onNavigate={onNavigate}
      headerSlot={mockMode && <Badge variant="secondary" className="text-[10px] px-1.5 h-4">mock</Badge>}
      footerSlot={
        <SidebarProfile
          email={user?.email ?? null}
          displayName={user?.displayName}
          photoURL={user?.photoURL}
          role="Admin"
        />
      }
    />
  )
}

export default function DashboardPage() {
  const [page, setPage] = useState<Page>('dashboard')
  const [prevPage, setPrevPage] = useState<Page>('dashboard')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const { data: prospectData } = useProspects()
  const newProspects = prospectData?.prospects.filter(p => p.status === 'new').length ?? 0

  function navigateTo(p: Page) {
    setPrevPage(page)
    setPage(p)
  }

  function openDetail(business: Business) {
    setSelectedBusiness(business)
    setPrevPage(page)
    setPage('demo-detail')
  }

  function goBack() {
    setPage(prevPage)
    setSelectedBusiness(null)
  }

  const sidebarActive = page === 'demo-detail' ? prevPage : page

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <AdminSidebar
        active={sidebarActive}
        onNavigate={navigateTo}
        newProspects={newProspects}
      />
      <main className="flex-1 overflow-y-auto p-8">

        {page === 'dashboard' && (
          <DashboardContent onNavigate={navigateTo} />
        )}

        {page === 'sales' && (
          <SalesPage onSelectBusiness={openDetail} />
        )}

        {page === 'demo-detail' && selectedBusiness && (
          <DemoDetailPage business={selectedBusiness} onBack={goBack} />
        )}

        {page === 'settings' && (
          <SettingsPage />
        )}

      </main>
    </div>
  )
}
