import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useImpersonationStore } from '../../store/impersonation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import AppSidebar, { SidebarProfile } from '../../components/layout/AppSidebar'
import ProductEditor from '../../components/demos/ProductEditor'
import type { NavItem } from '../../components/layout/AppSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BusinessStatus } from '@eguru/core'
import SettingsPage from '../settings/SettingsPage'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

type Page = 'catalog' | 'appearance' | 'settings'

// ── Product row ───────────────────────────────────────────────────────────────
const OWNER_NAV: NavItem<Page>[] = [
  { key: 'catalog',    icon: '🛍️', label: 'My Products' },
  { key: 'appearance', icon: '🎨', label: 'Appearance' },
]

// ── Catalog page (link + products) ───────────────────────────────────────────
function CatalogPage({ businessId, previewSlug, catalogUrl, isPreview, impersonateSlug, whatsappClicks }: {
  businessId: string
  previewSlug?: string
  catalogUrl: string
  isPreview: boolean
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
          {!isPreview && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={shareWhatsApp}>
                📱 Share on WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="flex-1" asChild>
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
            readonly={isPreview}
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
  const { impersonating, stopImpersonation } = useImpersonationStore()
  const navigate = useNavigate()
  const isPreview = !!previewSlug
  const isImpersonating = !!impersonating && !isPreview
  const businessId = impersonating?.businessId ?? previewSlug ?? user?.businessId ?? 'heladeria-el-pinguino'
  const [page, setPage] = useState<Page>('catalog')

  const { data: bizData } = useQuery({
    queryKey: ['owner-business', businessId],
    queryFn: () => api.get<{ name: string; slug: string; tagline?: string; whatsapp?: string; status: BusinessStatus; whatsappClicks?: number }>(`/api/v1/storefront/${businessId}`),
  })

  const catalogUrl = `${STOREFRONT_URL}/demo/${businessId}`

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <AppSidebar
        nav={OWNER_NAV}
        active={page}
        onNavigate={setPage}
        headerSlot={bizData?.name && <p className="text-xs text-muted-foreground mt-0.5 truncate">{bizData.name}</p>}
        footerSlot={
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
                onSettings={isPreview ? undefined : () => setPage('settings')}
              />
              {bizData?.status && (
                <Badge variant={bizData.status === BusinessStatus.Active ? 'default' : 'secondary'} className="text-xs shrink-0">
                  {bizData.status}
                </Badge>
              )}
            </div>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-8">
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
          <CatalogPage businessId={businessId} previewSlug={previewSlug} catalogUrl={catalogUrl} isPreview={isPreview} impersonateSlug={isImpersonating ? businessId : undefined} whatsappClicks={bizData?.whatsappClicks} />
        )}
        {page === 'appearance' && (
          <AppearancePage businessId={businessId} currentTagline={bizData?.tagline} currentWhatsapp={bizData?.whatsapp} readonly={isPreview} impersonateSlug={isImpersonating ? businessId : undefined} />
        )}
        {page === 'settings' && (
          <SettingsPage />
        )}
      </main>
    </div>
  )
}
