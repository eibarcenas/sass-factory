import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { useProspects } from '../hooks/useProspects'
import AppSidebar, { SidebarProfile } from '../components/layout/AppSidebar'
import type { NavItem } from '../components/layout/AppSidebar'
import SalesPage from './SalesPage'
import DemoDetailPage from './DemoDetailPage'
import SettingsPage from './settings/SettingsPage'
import { Badge } from '@/components/ui/badge'
import type { Business } from '@eguru/core'

type Page = 'dashboard' | 'sales' | 'demo-detail' | 'settings'

function AdminSidebar({ active, onNavigate, newProspects }: {
  active: Page
  onNavigate: (p: Page) => void
  newProspects: number
}) {
  const { user, mockMode } = useAuthStore()

  const nav: NavItem<Page>[] = [
    { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { key: 'sales',     icon: '✨', label: 'Sales', badge: newProspects },
  ]

  return (
    <AppSidebar
      nav={nav}
      active={active}
      onNavigate={onNavigate}
      onSettings={() => onNavigate('settings')}
      settingsActive={active === 'settings'}
      headerSlot={mockMode && <Badge variant="secondary" className="ml-2 text-xs">mock</Badge>}
      footerSlot={
        <SidebarProfile
          email={user?.email ?? null}
          displayName={user?.displayName}
          photoURL={user?.photoURL}
          onSettings={() => onNavigate('settings')}
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
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
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
