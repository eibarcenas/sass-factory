import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage'
import { useAuthStore, type UserRole } from './store/auth'

// Restore Firebase session on page reload
function useAuthRestore() {
  const [checking, setChecking] = useState(true)
  const { mockMode, setUser } = useAuthStore()

  useEffect(() => {
    if (mockMode) {
      setChecking(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    async function init() {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth')
        const { initializeApp, getApps } = await import('firebase/app')

        if (!getApps().length) {
          initializeApp({
            apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
          })
        }

        const auth = getAuth()
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            // User is still logged in — restore session with claims
            const { claims } = await fbUser.getIdTokenResult()
            const role = claims.role as UserRole | undefined
            if (role) {
              setUser({
                uid:        fbUser.uid,
                email:      fbUser.email,
                role,
                businessId: claims.business_id as string | undefined,
                modules:    (claims.modules as string[]) ?? [],
              })
            } else {
              // Logged in with Google but no role assigned yet
              setUser(null)
            }
          } else {
            setUser(null)
          }
          setChecking(false)
        })
      } catch {
        setChecking(false)
      }
    }

    init()
    return () => { unsubscribe?.() }
  }, [mockMode, setUser])

  return checking
}

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

function RoleRedirect() {
  const { user, mockMode } = useAuthStore()
  if (mockMode || user?.role === 'SUPER_ADMIN') return <Navigate to="/" replace />
  if (user?.role === 'OWNER') return <Navigate to="/owner" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  const checking = useAuthRestore()

  // Show nothing while Firebase checks the session (prevents login flash)
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
      <Route path="/redirect" element={<RoleRedirect />} />

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
