import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useSignOut } from '../../hooks/useSignOut'
import { useImpersonationStore } from '../../store/impersonation'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import AppSidebar, { SidebarProfile } from '../../components/layout/AppSidebar'
import ProductEditor from '../../components/catalog/ProductEditor'
import BusinessFormPanel from '../../components/businesses/BusinessFormPanel'
import type { NavItem } from '../../components/layout/AppSidebar'
import { MobileSidebar } from '@eguru/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Menu } from 'lucide-react'
import { BusinessStatus, BusinessType } from '@eguru/core'
// BusinessType imported for bizData queryFn type annotation
import SettingsPage from '../settings/SettingsPage'
import SellerRequestsPage from '../../components/seller/SellerRequestsPage'
import { isLocale, routes } from '@/lib/routes'

const STORE_URL = import.meta.env.VITE_STORE_URL ?? 'http://localhost:3010'

type Page = 'products' | 'profile' | 'requests'

// ── Pending activation banner ─────────────────────────────────────────────────
function PendingBanner({ onGoToAppearance }: { onGoToAppearance: () => void }) {
  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <svg viewBox="0 0 20 20" className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">Tu tienda está en revisión</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Recibimos tu solicitud. La revisamos y activamos tu tienda en menos de 24 horas.
          </p>
          <button
            onClick={onGoToAppearance}
            className="mt-2 text-xs font-medium text-amber-800 underline underline-offset-2"
          >
            Ver mi perfil →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product row ───────────────────────────────────────────────────────────────
const SELLER_NAV: NavItem<Page>[] = [
  { key: 'products', icon: '🛍️', label: 'Products' },
  { key: 'requests', icon: '📋', label: 'Requests' },
  { key: 'profile', icon: '🎨', label: 'Profile' },
]

// ── Store products page ──────────────────────────────────────────────────────
function StoreProductsPage({ businessId, reviewSlug, storeUrl, isReview, readonly, impersonateSlug, whatsappClicks }: {
  businessId: string
  reviewSlug?: string
  storeUrl: string
  isReview: boolean
  readonly?: boolean
  impersonateSlug?: string
  whatsappClicks?: number
}) {
  function copyLink() { navigator.clipboard.writeText(storeUrl) }
  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out my store! 🛍️ ${storeUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Products</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your store</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your store link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <p className="text-xs font-mono text-muted-foreground flex-1 truncate">{storeUrl}</p>
            <Button size="sm" variant="outline" onClick={copyLink}>Copy</Button>
          </div>
          {isReview ? (
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hola, aquí está tu sitio para revisar: ${storeUrl}`)}`, '_blank')}
            >
              📱 Compartir con cliente
            </Button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="sm" className="w-full sm:flex-1 bg-green-600 hover:bg-green-700" onClick={shareWhatsApp}>
                📱 Share on WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="w-full sm:flex-1" asChild>
                <a href={storeUrl} target="_blank" rel="noopener noreferrer">View store →</a>
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
            businessSlug={reviewSlug ?? businessId}
            scope="seller"
            reviewSlug={reviewSlug}
            impersonateSlug={impersonateSlug}
            readonly={isReview || readonly}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
interface SellerDashboardProps {
  reviewSlug?: string
}

export default function SellerDashboardPage({ reviewSlug }: SellerDashboardProps) {
  const { user } = useAuthStore()
  const handleSignOut = useSignOut()
  const { impersonating, stopImpersonation } = useImpersonationStore()
  const navigate = useNavigate()
  const { locale: localeParam, section } = useParams()
  const locale = isLocale(localeParam) ? localeParam : 'es'
  const isReview = !!reviewSlug
  const isImpersonating = !!impersonating && !isReview
  const businessId = impersonating?.businessId ?? reviewSlug ?? user?.businessId ?? 'heladeria-el-pinguino'
  const page: Page = section === 'requests' || section === 'profile' ? section : 'products'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function navigate_to(p: Page) {
    navigate(p === 'products' ? routes.sellerProducts(locale) : p === 'requests' ? routes.sellerRequests(locale) : routes.sellerProfile(locale))
    setMobileSidebarOpen(false)
  }

  const { data: bizData, refetch: refetchBiz } = useQuery({
    queryKey: ['seller-profile', businessId],
    queryFn: () => api.get<{ name: string; slug: string; logo?: string; type?: BusinessType; tagline?: string; whatsapp?: string; city?: string; state?: string; status: BusinessStatus; theme?: any; whatsappClicks?: number }>(`/api/v1/stores/${businessId}?review=${isReview ? '1' : '0'}`),
  })

  const storeUrl = isReview ? `${STORE_URL}/store/${businessId}` : `${STORE_URL}/${businessId}`

  const sidebarFooter = (
    <div className="space-y-2">
      {isReview && (
        <Badge variant="outline" className="w-full justify-center text-amber-700 border-amber-300 bg-amber-50">
          Store review
        </Badge>
      )}
      <div className="flex items-center gap-2">
        <SidebarProfile
          email={user?.email ?? null}
          displayName={user?.displayName}
          photoURL={user?.photoURL}
          onSettings={isReview ? undefined : () => navigate_to('profile')}
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
          nav={SELLER_NAV}
          active={page}
          onNavigate={navigate_to}
          headerSlot={sidebarHeader}
          footerSlot={sidebarFooter}
        />
      </div>

      {/* Mobile drawer */}
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)}>
        <AppSidebar
          nav={SELLER_NAV}
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
        {bizData?.status === BusinessStatus.Pending && !isReview && !isImpersonating && (
          <PendingBanner onGoToAppearance={() => navigate_to('profile')} />
        )}

        {isImpersonating && (
          <div data-testid="impersonation-banner" className="mb-6 flex items-center justify-between gap-2 p-3 rounded-lg border border-orange-200 bg-orange-50 text-sm text-orange-800">
            <span>⚠️ <strong>Acting as seller</strong> — You are impersonating <strong>{impersonating!.businessName}</strong>. Changes are real.</span>
            <button
              onClick={() => { stopImpersonation(); navigate(routes.platformBusinesses(locale)) }}
              className="shrink-0 px-3 py-1 rounded-md border border-orange-300 bg-orange-100 hover:bg-orange-200 text-xs font-medium transition-colors"
            >
              Exit ↩
            </button>
          </div>
        )}
        {isReview && (
          <div data-testid="review-banner" className="mb-6 flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
            <span>🔍</span>
            <span><strong>Reviewing as seller</strong> — Read-only platform review.</span>
          </div>
        )}

        {page === 'products' && (
          <StoreProductsPage businessId={businessId} reviewSlug={reviewSlug} storeUrl={storeUrl} isReview={isReview} readonly={false} impersonateSlug={isImpersonating ? businessId : undefined} whatsappClicks={bizData?.whatsappClicks} />
        )}
        {page === 'profile' && bizData && (
          <BusinessFormPanel
            mode="seller"
            defaultValues={{ ...bizData, slug: businessId }}
            businessSlug={isImpersonating ? businessId : undefined}
            readonly={isReview}
            onSaved={() => refetchBiz()}
          />
        )}
        {page === 'requests' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Solicitudes</h1>
              <p className="text-muted-foreground text-sm mt-1">Cotizaciones recibidas de clientes</p>
            </div>
            <SellerRequestsPage />
          </div>
        )}
        {page === 'profile' && !isReview && <SettingsPage onSignOut={handleSignOut} />}
        </div>
      </main>
    </div>
  )
}
