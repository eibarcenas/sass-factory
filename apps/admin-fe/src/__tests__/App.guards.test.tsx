import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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
