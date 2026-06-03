import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BusinessStatus, type Business } from '@eguru/core'

// Stub CreateOwnerModal to avoid needing full modal deps
vi.mock('../../components/demos/CreateOwnerModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="owner-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

// Stub ProductEditor
vi.mock('../../components/demos/ProductEditor', () => ({
  default: () => <div data-testid="product-editor" />,
}))

// Stub hooks
vi.mock('../../hooks/useBusinesses', () => ({
  useBusinesses: () => ({ data: undefined, isLoading: false }),
  useBusinessAction: () => ({ isPending: false, mutate: vi.fn() }),
}))

import DemoList from '../../components/demos/DemoList'

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function makeBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: 'heladeria-el-pinguino',
    slug: 'heladeria-el-pinguino',
    name: 'Heladería El Pingüino',
    type: 'heladeria',
    city: 'Monterrey',
    status: BusinessStatus.Demo,
    plan: 'free',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as Business
}

vi.mock('../../hooks/useBusinesses', () => ({
  useBusinesses: () => ({
    data: { businesses: [makeBusiness()] },
    isLoading: false,
  }),
  useBusinessAction: () => ({ isPending: false, mutate: vi.fn() }),
}))

function renderDemoList() {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DemoList />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DemoCard — Activate owner button', () => {
  it('shows "Activate owner" button on every card', () => {
    renderDemoList()
    expect(screen.getByRole('button', { name: /activate owner/i })).toBeInTheDocument()
  })

  it('modal is closed by default', () => {
    renderDemoList()
    expect(screen.queryByTestId('owner-modal')).not.toBeInTheDocument()
  })

  it('clicking "Activate owner" opens the modal', () => {
    renderDemoList()
    fireEvent.click(screen.getByRole('button', { name: /activate owner/i }))
    expect(screen.getByTestId('owner-modal')).toBeInTheDocument()
  })

  it('closing the modal hides it', () => {
    renderDemoList()
    fireEvent.click(screen.getByRole('button', { name: /activate owner/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByTestId('owner-modal')).not.toBeInTheDocument()
  })
})

describe('DemoCard — Preview panel button', () => {
  it('shows "Preview panel" button on every card', () => {
    renderDemoList()
    expect(screen.getByRole('button', { name: /preview panel/i })).toBeInTheDocument()
  })
})
