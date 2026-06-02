import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useFirebaseAuthRestore } from '@eguru/auth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminLayout, { DashboardContent } from './pages/DashboardPage'
import SalesPage from './pages/SalesPage'
import NewDemoPage from './pages/NewDemoPage'
import DemoDetailPage from './pages/DemoDetailPage'
import SettingsPage from './pages/settings/SettingsPage'
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage'
import { useAuthStore, type UserRole } from './store/auth'
import { useImpersonationStore } from './store/impersonation'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const RESOLVE_CLAIMS_URL = `${API_URL}/api/v1/auth/resolve-claims`
const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

const FIREBASE_CONFIG = import.meta.env.VITE_FIREBASE_API_KEY
  ? {
      apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
    }
  : null

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, mockMode } = useAuthStore()
  if (!mockMode && !user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user?.role !== 'SUPER_ADMIN') return <Navigate to="/owner" replace />
  return <>{children}</>
}

function RequireOwner({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { impersonating } = useImpersonationStore()
  if (user?.role !== 'OWNER' && !impersonating) return <Navigate to="/" replace />
  return <>{children}</>
}

function OwnerPreviewPage() {
  const { slug } = useParams<{ slug: string }>()
  return <OwnerDashboardPage previewSlug={slug} />
}

function RoleRedirect() {
  const { user, mockMode } = useAuthStore()
  if (mockMode || user?.role === 'SUPER_ADMIN') return <Navigate to="/" replace />
  if (user?.role === 'OWNER') return <Navigate to="/owner" replace />
  return <Navigate to="/login" replace />
}

function ExternalLandingRedirect() {
  window.location.replace(LANDING_URL)
  return null
}

export default function App() {
  const store = useAuthStore()
  const { checking } = useFirebaseAuthRestore({
    store,
    firebaseConfig: FIREBASE_CONFIG,
    resolveClaimsUrl: RESOLVE_CLAIMS_URL,
    buildUser: (uid, email, claims, displayName, photoURL) => {
      const role = claims.role as UserRole | undefined
      if (!role) return null
      return {
        uid,
        email,
        displayName: displayName ?? null,
        photoURL: photoURL ?? null,
        role,
        businessId: claims.business_id as string | undefined,
        modules: (claims.modules as string[]) ?? [],
      }
    },
  })

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/redirect" element={<RoleRedirect />} />

      {/* Admin section — shared layout with nested page routes */}
      <Route
        element={
          <RequireAuth>
            <RequireSuperAdmin>
              <AdminLayout />
            </RequireSuperAdmin>
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardContent />} />
        <Route path="/clientes" element={<SalesPage />} />
        <Route path="/clientes/new" element={<NewDemoPage />} />
        <Route path="/clientes/:businessId" element={<DemoDetailPage />} />
        <Route path="/ajustes" element={<SettingsPage />} />
      </Route>

      {/* Owner preview (admin viewing a business as owner) */}
      <Route
        path="/owner/preview/:slug"
        element={
          <RequireAuth>
            <RequireSuperAdmin>
              <OwnerPreviewPage />
            </RequireSuperAdmin>
          </RequireAuth>
        }
      />

      {/* Owner panel */}
      <Route
        path="/owner/*"
        element={
          <RequireAuth>
            <RequireOwner>
              <OwnerDashboardPage />
            </RequireOwner>
          </RequireAuth>
        }
      />

      {/* Unknown routes should not trap cold visitors inside admin */}
      <Route path="*" element={<ExternalLandingRedirect />} />
    </Routes>
  )
}
