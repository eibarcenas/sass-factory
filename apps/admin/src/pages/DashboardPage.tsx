import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { useBusinesses } from '../hooks/useBusinesses'
import { useProspects } from '../hooks/useProspects'
import CreateDemoForm from '../components/demos/CreateDemoForm'
import DemoList from '../components/demos/DemoList'
import ProspectsPage from './ProspectsPage'
import AppSidebar from '../components/layout/AppSidebar'
import type { NavItem } from '../components/layout/AppSidebar'
import { BusinessStatus } from '@eguru/core'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

type Page = 'dashboard' | 'demos' | 'prospects'

function AdminSidebar({ active, onNavigate }: { active: Page; onNavigate: (p: Page) => void }) {
  const { user, mockMode } = useAuthStore()
  const { data: bizData } = useBusinesses()
  const { data: prospectData } = useProspects()
  const newProspects = prospectData?.prospects.filter(p => p.status === 'new').length ?? 0

  const pipeline = [
    { label: 'Draft',    status: BusinessStatus.Draft },
    { label: 'Demo',     status: BusinessStatus.Demo },
    { label: 'Sent',     status: BusinessStatus.Sent },
    { label: 'Accepted', status: BusinessStatus.Accepted },
    { label: 'Active',   status: BusinessStatus.Active },
  ]

  const nav: NavItem<Page>[] = [
    { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { key: 'demos',     icon: '✨', label: 'Demos' },
    { key: 'prospects', icon: '👥', label: 'Prospects', badge: newProspects },
  ]

  return (
    <AppSidebar
      nav={nav}
      active={active}
      onNavigate={onNavigate}
      headerSlot={mockMode && <Badge variant="secondary" className="ml-2 text-xs">mock</Badge>}
      footerSlot={<p className="text-xs text-muted-foreground truncate">{user?.email}</p>}
    >
      <div className="pt-4 px-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pipeline</p>
        <div className="space-y-1.5">
          {pipeline.map(({ label, status }) => {
            const count = bizData?.businesses.filter(b => b.status === status).length ?? 0
            return (
              <div key={status} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </AppSidebar>
  )
}

export default function DashboardPage() {
  const [page, setPage] = useState<Page>('dashboard')
  const [showForm, setShowForm] = useState(false)
  const { data } = useBusinesses()
  const { data: prospectData } = useProspects()

  const activeCount = data?.businesses.filter(b => b.status === BusinessStatus.Active).length ?? 0
  const demoCount = data?.businesses.filter(b => [BusinessStatus.Demo, BusinessStatus.Sent, BusinessStatus.Accepted].includes(b.status)).length ?? 0
  const newProspects = prospectData?.prospects.filter(p => p.status === 'new').length ?? 0

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <AdminSidebar active={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto p-8">

        {page === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Sales pipeline overview</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Active businesses', value: activeCount },
                { label: 'In pipeline', value: demoCount },
                { label: 'New prospects', value: newProspects, highlight: newProspects > 0 },
              ].map(stat => (
                <Card key={stat.label} className={stat.highlight ? 'border-green-300 bg-green-50' : ''}>
                  <CardContent className="pt-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${stat.highlight ? 'text-green-700' : ''}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Quick create demo
                  <Button size="sm" variant={showForm ? 'ghost' : 'default'} onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New demo'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showForm && (
                <CardContent>
                  <CreateDemoForm onSuccess={(slug) => { setShowForm(false); window.open(`${STOREFRONT_URL}/demo/${slug}`, '_blank') }} />
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {page === 'demos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-bold">Demos</h1><p className="text-muted-foreground text-sm mt-1">Sales pipeline</p></div>
              <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New demo'}</Button>
            </div>
            {showForm && (
              <Card><CardContent className="pt-5">
                <CreateDemoForm onSuccess={(slug) => { setShowForm(false); window.open(`${STOREFRONT_URL}/demo/${slug}`, '_blank') }} />
              </CardContent></Card>
            )}
            <DemoList />
          </div>
        )}

        {page === 'prospects' && <ProspectsPage />}

      </main>
    </div>
  )
}
