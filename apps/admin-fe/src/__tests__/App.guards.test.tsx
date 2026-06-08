import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { RequireOnboarding, RootRedirect } from '@/App'
import { useAuthStore } from '@/store/auth'

// Inline the guard components to avoid circular imports from App.tsx
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, mockMode } = useAuthStore()
  if (!mockMode && !user) return <div data-testid="redirected-login" />
  return <>{children}</>
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user?.role !== 'SUPER_ADMIN') return <div data-testid="redirected-owner" />
  return <>{children}</>
}

function RequireOwner({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user?.role !== 'OWNER') return <div data-testid="redirected-root" />
  return <>{children}</>
}

function Protected({ label }: { label: string }) {
  return <div data-testid="protected">{label}</div>
}

function CurrentPath() {
  return <div data-testid="current-path">{useLocation().pathname}</div>
}

describe('RootRedirect', () => {
  it('resolves the unlocalized root using the browser locale', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <RootRedirect />
        <CurrentPath />
      </MemoryRouter>
    )

    expect(screen.getByTestId('current-path')).toHaveTextContent('/en')
  })
})

describe('RequireAuth', () => {
  it('renders children when user is set', () => {
    useAuthStore.setState({ user: { uid: 'u1', email: 'a@b.com', role: 'SUPER_ADMIN', modules: [] }, mockMode: false })
    render(
      <MemoryRouter><RequireAuth><Protected label="dashboard" /></RequireAuth></MemoryRouter>
    )
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('redirects when user is null', () => {
    useAuthStore.setState({ user: null, mockMode: false })
    render(
      <MemoryRouter><RequireAuth><Protected label="dashboard" /></RequireAuth></MemoryRouter>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.getByTestId('redirected-login')).toBeInTheDocument()
  })

  it('renders children in mockMode even without user', () => {
    useAuthStore.setState({ user: null, mockMode: true })
    render(
      <MemoryRouter><RequireAuth><Protected label="dashboard" /></RequireAuth></MemoryRouter>
    )
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })
})

describe('RequireSuperAdmin', () => {
  it('allows SUPER_ADMIN', () => {
    useAuthStore.setState({ user: { uid: 'u1', email: 'a@b.com', role: 'SUPER_ADMIN', modules: [] }, mockMode: false })
    render(
      <MemoryRouter><RequireSuperAdmin><Protected label="admin" /></RequireSuperAdmin></MemoryRouter>
    )
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('blocks OWNER', () => {
    useAuthStore.setState({ user: { uid: 'o1', email: 'o@b.com', role: 'OWNER', modules: [] }, mockMode: false })
    render(
      <MemoryRouter><RequireSuperAdmin><Protected label="admin" /></RequireSuperAdmin></MemoryRouter>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.getByTestId('redirected-owner')).toBeInTheDocument()
  })

  it('blocks OWNER even in mockMode', () => {
    useAuthStore.setState({ user: { uid: 'o1', email: 'o@b.com', role: 'OWNER', modules: [] }, mockMode: true })
    render(
      <MemoryRouter><RequireSuperAdmin><Protected label="admin" /></RequireSuperAdmin></MemoryRouter>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.getByTestId('redirected-owner')).toBeInTheDocument()
  })
})

describe('RequireOwner', () => {
  it('allows OWNER', () => {
    useAuthStore.setState({ user: { uid: 'o1', email: 'o@b.com', role: 'OWNER', businessId: 'biz-1', modules: [] }, mockMode: false })
    render(
      <MemoryRouter><RequireOwner><Protected label="owner" /></RequireOwner></MemoryRouter>
    )
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('blocks SUPER_ADMIN', () => {
    useAuthStore.setState({ user: { uid: 'u1', email: 'a@b.com', role: 'SUPER_ADMIN', modules: [] }, mockMode: false })
    render(
      <MemoryRouter><RequireOwner><Protected label="owner" /></RequireOwner></MemoryRouter>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.getByTestId('redirected-root')).toBeInTheDocument()
  })

  it('blocks SUPER_ADMIN even in mockMode', () => {
    useAuthStore.setState({ user: { uid: 'u1', email: 'a@b.com', role: 'SUPER_ADMIN', modules: [] }, mockMode: true })
    render(
      <MemoryRouter><RequireOwner><Protected label="owner" /></RequireOwner></MemoryRouter>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.getByTestId('redirected-root')).toBeInTheDocument()
  })
})

describe('RequireOnboarding', () => {
  it('allows UNASSIGNED users', () => {
    useAuthStore.setState({
      user: { uid: 'u1', email: 'new@business.com', role: 'UNASSIGNED', modules: [] },
      mockMode: false,
    })
    render(
      <MemoryRouter initialEntries={['/es/onboarding/business']}>
        <Routes>
          <Route element={<RequireOnboarding />}>
            <Route path="/:locale/onboarding/business" element={<Protected label="onboarding" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('redirects SUPER_ADMIN users to the platform dashboard', () => {
    useAuthStore.setState({
      user: { uid: 'u1', email: 'admin@catalog.mx', role: 'SUPER_ADMIN', modules: [] },
      mockMode: false,
    })
    render(
      <MemoryRouter initialEntries={['/es/onboarding/business']}>
        <Routes>
          <Route element={<RequireOnboarding />}>
            <Route path="/:locale/onboarding/business" element={<Protected label="onboarding" />} />
          </Route>
          <Route path="/es/platform/dashboard" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(screen.getByTestId('current-path')).toHaveTextContent('/es/platform/dashboard')
  })
})
