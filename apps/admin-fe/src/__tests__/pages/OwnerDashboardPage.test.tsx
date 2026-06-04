import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ name: 'Heladería El Pingüino', slug: 'heladeria-el-pinguino', status: 'active', items: [] }),
    patch: vi.fn(),
  },
}))

vi.mock('@/hooks/useItems', () => ({
  useItems: () => ({ data: { items: [] }, isLoading: false, refetch: vi.fn() }),
  useAddItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useOwnerItems: () => ({ data: { items: [] }, isLoading: false, refetch: vi.fn() }),
  useOwnerUpdateItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useOwnerDeleteItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useOwnerAddItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

import OwnerDashboardPage from '@/pages/owner/OwnerDashboardPage'

function renderPage(previewSlug?: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <OwnerDashboardPage previewSlug={previewSlug} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('OwnerDashboardPage — normal mode', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'o1', email: 'owner@catalog.mx', role: 'OWNER', businessId: 'heladeria-el-pinguino', modules: [] },
      mockMode: false,
    })
  })

  it('does not show preview banner', () => {
    renderPage()
    expect(screen.queryByTestId('preview-banner')).not.toBeInTheDocument()
  })

  it('shows WhatsApp share button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /whatsapp/i })).toBeInTheDocument()
  })

  it('shows Add product button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument()
  })
})

describe('OwnerDashboardPage — preview mode (SUPER_ADMIN)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'a1', email: 'admin@catalog.mx', role: 'SUPER_ADMIN', modules: [] },
      mockMode: false,
    })
  })

  it('shows preview banner when previewSlug is provided', () => {
    renderPage('heladeria-el-pinguino')
    expect(screen.getByTestId('preview-banner')).toBeInTheDocument()
  })

  it('banner says read-only mode', () => {
    renderPage('heladeria-el-pinguino')
    expect(screen.getByTestId('preview-banner')).toHaveTextContent(/read-only/i)
  })

  it('does not show WhatsApp share button in preview', () => {
    renderPage('heladeria-el-pinguino')
    expect(screen.queryByRole('button', { name: /whatsapp/i })).not.toBeInTheDocument()
  })

  it('does not show Add product button in preview', () => {
    renderPage('heladeria-el-pinguino')
    expect(screen.queryByRole('button', { name: /add product/i })).not.toBeInTheDocument()
  })
})
