import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useSignOut } from '../../hooks/useSignOut'
import { useImpersonationStore } from '../../store/impersonation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import AppSidebar, { SidebarProfile } from '../../components/layout/AppSidebar'
import ProductEditor from '../../components/catalog/ProductEditor'
import type { NavItem } from '../../components/layout/AppSidebar'
import { MobileSidebar } from '@eguru/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Menu } from 'lucide-react'
import { BusinessStatus } from '@eguru/core'
import SettingsPage from '../settings/SettingsPage'
import OwnerRequestsPage from '../../components/owner/OwnerRequestsPage'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

type Page = 'catalog' | 'appearance' | 'settings' | 'requests'

// ── Pending activation banner ─────────────────────────────────────────────────
function PendingBanner() {
  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <svg viewBox="0 0 20 20" className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-blue-900">Tu sitio está pendiente de activación</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Agrega tus productos y personaliza tu página. Lo activamos pronto.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Product row ───────────────────────────────────────────────────────────────
const OWNER_NAV: NavItem<Page>[] = [
  { key: 'catalog',    icon: '🛍️', label: 'My Products' },
  { key: 'requests',   icon: '📋', label: 'Solicitudes' },
  { key: 'appearance', icon: '🎨', label: 'Appearance' },
]

// ── Catalog page (link + products) ───────────────────────────────────────────
function CatalogPage({ businessId, previewSlug, catalogUrl, isPreview, readonly, impersonateSlug, whatsappClicks }: {
  businessId: string
  previewSlug?: string
  catalogUrl: string
  isPreview: boolean
  readonly?: boolean
  impersonateSlug?: string
  whatsappClicks?: number
}) {
  function copyLink() { navigator.clipboard.writeText(catalogUrl) }
  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out my catalog! 🛍️ ${catalogUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Products</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your catalog</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your catalog link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <p className="text-xs font-mono text-muted-foreground flex-1 truncate">{catalogUrl}</p>
            <Button size="sm" variant="outline" onClick={copyLink}>Copy</Button>
          </div>
          {isPreview ? (
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hola, aquí está tu sitio para revisar: ${catalogUrl}`)}`, '_blank')}
            >
              📱 Compartir con cliente
            </Button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="sm" className="w-full sm:flex-1 bg-green-600 hover:bg-green-700" onClick={shareWhatsApp}>
                📱 Share on WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="w-full sm:flex-1" asChild>
                <a href={catalogUrl} target="_blank" rel="noopener noreferrer">View catalog →</a>
              </Button>
            </div>
          )}
          {typeof whatsappClicks === 'number' && (
            <p className="text-xs text-muted-foreground">
              📱 {whatsappClicks} WhatsApp clicks
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <ProductEditor
            businessId={businessId}
            businessSlug={previewSlug ?? businessId}
            scope="owner"
            previewSlug={previewSlug}
            impersonateSlug={impersonateSlug}
            readonly={isPreview || readonly}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Appearance page ───────────────────────────────────────────────────────────
function AppearancePage({ businessId, currentTagline, currentWhatsapp, readonly = false, impersonateSlug }: {
  businessId: string
  currentTagline?: string
  currentWhatsapp?: string
  readonly?: boolean
  impersonateSlug?: string
}) {
  const [tagline, setTagline] = useState(currentTagline ?? '')
  const [whatsapp, setWhatsapp] = useState(currentWhatsapp ?? '')
  const [saved, setSaved] = useState(false)
  const qc = useQueryClient()

  useEffect(() => {
    if (currentTagline !== undefined) setTagline(currentTagline)
  }, [currentTagline])

  useEffect(() => {
    if (currentWhatsapp !== undefined) setWhatsapp(currentWhatsapp)
  }, [currentWhatsapp])

  const qs = impersonateSlug ? `?business=${impersonateSlug}` : ''
  const save = useMutation({
    mutationFn: () => api.patch(`/api/v1/owner/business${qs}`, { tagline, whatsapp }),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); qc.invalidateQueries({ queryKey: ['owner-business'] }) },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appearance</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize how your catalog looks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tagline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Tagline <span className="text-muted-foreground font-normal text-xs">({tagline.length}/120)</span></Label>
            <Input value={tagline} onChange={e => setTagline(e.target.value)} maxLength={120}
              placeholder="The best ice cream in Monterrey 🍦" disabled={readonly} />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp number</Label>
            <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              placeholder="+52 55 1234 5678" disabled={readonly} />
          </div>
          {!readonly && (
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              {saved ? '✓ Saved' : save.isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
interface OwnerDashboardProps {
  previewSlug?: string
}

export default function OwnerDashboardPage({ previewSlug }: OwnerDashboardProps) {
  const { user } = useAuthStore()
  const handleSignOut = useSignOut()
  const { impersonating, stopImpersonation } = useImpersonationStore()
  const navigate = useNavigate()
  const isPreview = !!previewSlug
  const isImpersonating = !!impersonating && !isPreview
  const businessId = impersonating?.businessId ?? previewSlug ?? user?.businessId ?? 'heladeria-el-pinguino'
  const [page, setPage] = useState<Page>('catalog')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function navigate_to(p: Page) {
    setPage(p)
    setMobileSidebarOpen(false)
  }

  const { data: bizData } = useQuery({
    queryKey: ['owner-business', businessId],
    queryFn: () => api.get<{ name: string; slug: string; tagline?: string; whatsapp?: string; status: BusinessStatus; whatsappClicks?: number }>(`/api/v1/storefront/${businessId}`),
  })

  const catalogUrl = `${STOREFRONT_URL}/demo/${businessId}`
  const isUnderReview = !isImpersonating && !isPreview && bizData?.status === BusinessStatus.Pending

  const sidebarFooter = (
    <div className="space-y-2">
      {isPreview && (
        <Badge variant="outline" className="w-full justify-center text-amber-700 border-amber-300 bg-amber-50">
          Preview mode
        </Badge>
      )}
      <div className="flex items-center gap-2">
        <SidebarProfile
          email={user?.email ?? null}
          displayName={user?.displayName}
          photoURL={user?.photoURL}
          onSettings={isPreview ? undefined : () => navigate_to('settings')}
        />
        {bizData?.status && (
          <Badge variant={bizData.status === BusinessStatus.Active ? 'default' : 'secondary'} className="text-xs shrink-0">
            {bizData.status}
          </Badge>
        )}
      </div>
    </div>
  )

  const sidebarHeader = bizData?.name
    ? <p className="text-xs text-muted-foreground mt-0.5 truncate">{bizData.name}</p>
    : undefined

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          nav={OWNER_NAV}
          active={page}
          onNavigate={setPage}
          headerSlot={sidebarHeader}
          footerSlot={sidebarFooter}
        />
      </div>

      {/* Mobile drawer */}
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)}>
        <AppSidebar
          nav={OWNER_NAV}
          active={page}
          onNavigate={navigate_to}
          headerSlot={sidebarHeader}
          footerSlot={sidebarFooter}
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
        {bizData?.status === BusinessStatus.Pending && !isPreview && !isImpersonating && (
          <PendingBanner />
        )}

        {isImpersonating && (
          <div data-testid="impersonation-banner" className="mb-6 flex items-center justify-between gap-2 p-3 rounded-lg border border-orange-200 bg-orange-50 text-sm text-orange-800">
            <span>⚠️ <strong>Acting as owner</strong> — You are impersonating <strong>{impersonating!.businessName}</strong>. Changes are real.</span>
            <button
              onClick={() => { stopImpersonation(); navigate('/clientes') }}
              className="shrink-0 px-3 py-1 rounded-md border border-orange-300 bg-orange-100 hover:bg-orange-200 text-xs font-medium transition-colors"
            >
              Exit ↩
            </button>
          </div>
        )}
        {isPreview && (
          <div data-testid="preview-banner" className="mb-6 flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
            <span>🔍</span>
            <span><strong>Previewing as owner</strong> — You are viewing this as SUPER_ADMIN. Read-only mode.</span>
          </div>
        )}

        {page === 'catalog' && (
          <CatalogPage businessId={businessId} previewSlug={previewSlug} catalogUrl={catalogUrl} isPreview={isPreview} readonly={isUnderReview} impersonateSlug={isImpersonating ? businessId : undefined} whatsappClicks={bizData?.whatsappClicks} />
        )}
        {page === 'appearance' && (
          <AppearancePage businessId={businessId} currentTagline={bizData?.tagline} currentWhatsapp={bizData?.whatsapp} readonly={isPreview || isUnderReview} impersonateSlug={isImpersonating ? businessId : undefined} />
        )}
        {page === 'requests' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Solicitudes</h1>
              <p className="text-muted-foreground text-sm mt-1">Cotizaciones recibidas de clientes</p>
            </div>
            <OwnerRequestsPage />
          </div>
        )}
        {page === 'settings' && (
          <SettingsPage onSignOut={isPreview ? undefined : handleSignOut} />
        )}
        </div>
      </main>
    </div>
  )
}
