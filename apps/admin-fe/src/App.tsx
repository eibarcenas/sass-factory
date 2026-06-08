import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { useFirebaseAuthRestore } from '@eguru/auth'
import AuthCallbackPage from './pages/AuthCallbackPage'
import RegisterPage from './pages/RegisterPage'
import AdminLayout, { DashboardContent } from './pages/DashboardPage'
import SalesPage from './pages/SalesPage'
import NewClientPage from './pages/NewClientPage'
import ClientDetailPage from './pages/ClientDetailPage'
import SettingsPage from './pages/settings/SettingsPage'
import SellerDashboardPage from './pages/seller/SellerDashboardPage'
import PlatformImpersonatePage from './pages/PlatformImpersonatePage'
import { useAuthStore, type UserRole } from './store/auth'
import { useSignOut } from './hooks/useSignOut'
import { useImpersonationStore } from './store/impersonation'
import { browserLocale, homeForRole, isLocale, routes, type Locale } from './lib/routes'

const API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8001'
const RESOLVE_CLAIMS_URL = `${API_URL}/api/v1/auth/claims/resolve`
const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

const FIREBASE_CONFIG = import.meta.env.VITE_FIREBASE_API_KEY
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    }
  : null

function useLocaleParam(): Locale | null {
  const { locale } = useParams()
  return isLocale(locale) ? locale : null
}

function RequireAuth() {
  const locale = useLocaleParam()
  const { user, mockMode } = useAuthStore()
  if (!locale) return <NotFound />
  if (!mockMode && !user) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.replace(`${LANDING_URL}/${locale}?returnTo=${returnTo}`)
    return null
  }
  return <Outlet />
}

function RequirePlatform() {
  const locale = useLocaleParam()
  const { user } = useAuthStore()
  if (!locale) return <NotFound />
  if (user?.role !== 'SUPER_ADMIN') return <Navigate to={routes.sellerProducts(locale)} replace />
  return <Outlet />
}

function RequireSeller() {
  const locale = useLocaleParam()
  const { user } = useAuthStore()
  const { impersonating } = useImpersonationStore()
  if (!locale) return <NotFound />
  if (user?.role !== 'OWNER' && !impersonating) return <Navigate to={routes.platformDashboard(locale)} replace />
  return <Outlet />
}

export function RequireOnboarding() {
  const locale = useLocaleParam()
  const { user } = useAuthStore()
  if (!locale) return <NotFound />
  if (user?.role !== 'UNASSIGNED') {
    return <Navigate to={homeForRole(locale, user?.role)} replace />
  }
  return <Outlet />
}

function LocalizedRoot() {
  const locale = useLocaleParam()
  const { user, mockMode } = useAuthStore()
  if (!locale) return <NotFound />
  return <Navigate to={homeForRole(locale, mockMode ? 'SUPER_ADMIN' : user?.role)} replace />
}

export function RootRedirect() {
  return <Navigate to={`/${browserLocale()}`} replace />
}

function PlatformStoreReview() {
  const { businessId } = useParams()
  return <SellerDashboardPage reviewSlug={businessId} />
}

function NotFound() {
  return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">404</div>
}

export default function App() {
  const store = useAuthStore()
  const handleSignOut = useSignOut()
  const { checking } = useFirebaseAuthRestore({
    store,
    firebaseConfig: FIREBASE_CONFIG,
    resolveClaimsUrl: RESOLVE_CLAIMS_URL,
    buildUser: (uid, email, claims, displayName, photoURL) => {
      const role = claims.role as UserRole | undefined
      return {
        uid,
        email,
        displayName: displayName ?? null,
        photoURL: photoURL ?? null,
        role: role ?? 'UNASSIGNED',
        businessId: claims.business_id as string | undefined,
        modules: (claims.modules as string[]) ?? [],
      }
    },
  })

  if (checking) {
    return <div className="min-h-screen grid place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" /></div>
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:locale/auth/callback" element={<AuthCallbackPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/:locale" element={<LocalizedRoot />} />
        <Route element={<RequireOnboarding />}>
          <Route path="/:locale/onboarding/business" element={<RegisterPage />} />
        </Route>

        <Route element={<RequirePlatform />}>
          <Route element={<AdminLayout />}>
            <Route path="/:locale/platform/dashboard" element={<DashboardContent />} />
            <Route path="/:locale/platform/businesses" element={<SalesPage />} />
            <Route path="/:locale/platform/businesses/new" element={<NewClientPage />} />
            <Route path="/:locale/platform/businesses/:businessId" element={<ClientDetailPage />} />
            <Route path="/:locale/platform/profile" element={<SettingsPage onSignOut={handleSignOut} />} />
          </Route>
          <Route path="/:locale/platform/businesses/:businessId/store" element={<PlatformStoreReview />} />
          <Route path="/:locale/platform/businesses/:businessId/impersonate" element={<PlatformImpersonatePage />} />
        </Route>

        <Route element={<RequireSeller />}>
          <Route path="/:locale/seller/:section" element={<SellerDashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
