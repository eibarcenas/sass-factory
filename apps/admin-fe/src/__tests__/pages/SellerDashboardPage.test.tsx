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
  useSellerItems: () => ({ data: { items: [] }, isLoading: false, refetch: vi.fn() }),
  useSellerUpdateItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSellerDeleteItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSellerAddItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

import SellerDashboardPage from '@/pages/seller/SellerDashboardPage'

function renderPage(reviewSlug?: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SellerDashboardPage reviewSlug={reviewSlug} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('SellerDashboardPage — normal mode', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'o1', email: 'seller@catalog.mx', role: 'OWNER', businessId: 'heladeria-el-pinguino', modules: [] },
      mockMode: false,
    })
  })

  it('does not show review banner', () => {
    renderPage()
    expect(screen.queryByTestId('review-banner')).not.toBeInTheDocument()
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

describe('SellerDashboardPage — review mode (SUPER_ADMIN)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'a1', email: 'admin@catalog.mx', role: 'SUPER_ADMIN', modules: [] },
      mockMode: false,
    })
  })

  it('shows review banner when reviewSlug is provided', () => {
    renderPage('heladeria-el-pinguino')
    expect(screen.getByTestId('review-banner')).toBeInTheDocument()
  })

  it('banner says read-only mode', () => {
    renderPage('heladeria-el-pinguino')
    expect(screen.getByTestId('review-banner')).toHaveTextContent(/read-only/i)
  })

  it('does not show WhatsApp share button in review', () => {
    renderPage('heladeria-el-pinguino')
    expect(screen.queryByRole('button', { name: /whatsapp/i })).not.toBeInTheDocument()
  })

  it('does not show Add product button in review', () => {
    renderPage('heladeria-el-pinguino')
    expect(screen.queryByRole('button', { name: /add product/i })).not.toBeInTheDocument()
  })
})
