import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage'
import { useAuthStore } from './store/auth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, mockMode } = useAuthStore()
  if (!mockMode && !user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user, mockMode } = useAuthStore()
  if (!mockMode && user?.role !== 'SUPER_ADMIN') return <Navigate to="/owner" replace />
  return <>{children}</>
}

function RequireOwner({ children }: { children: React.ReactNode }) {
  const { user, mockMode } = useAuthStore()
  if (!mockMode && user?.role !== 'OWNER') return <Navigate to="/" replace />
  return <>{children}</>
}

// After login, redirect based on role
function RoleRedirect() {
  const { user, mockMode } = useAuthStore()
  if (mockMode || user?.role === 'SUPER_ADMIN') return <Navigate to="/" replace />
  if (user?.role === 'OWNER') return <Navigate to="/owner" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/redirect" element={<RoleRedirect />} />

      {/* Super admin routes */}
      <Route
        path="/*"
        element={
          <RequireAuth>
            <RequireSuperAdmin>
              <DashboardPage />
            </RequireSuperAdmin>
          </RequireAuth>
        }
      />

      {/* Owner routes */}
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
    </Routes>
  )
}
