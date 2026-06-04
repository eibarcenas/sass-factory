import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/ui/StatusBadge'
import { BusinessStatus } from '@eguru/core'

const STATUSES: [BusinessStatus, string][] = [
  [BusinessStatus.Pending,  'Pendiente'],
  [BusinessStatus.Active,   'Activa'],
  [BusinessStatus.Inactive, 'Inactiva'],
]

describe('StatusBadge', () => {
  it.each(STATUSES)('renders correct label for %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('applies color class for active status', () => {
    const { container } = render(<StatusBadge status={BusinessStatus.Active} />)
    expect(container.firstChild).toHaveClass('bg-emerald-100')
  })

  it('applies color class for inactive status', () => {
    const { container } = render(<StatusBadge status={BusinessStatus.Inactive} />)
    expect(container.firstChild).toHaveClass('bg-slate-100')
  })

  it('applies color class for pending status', () => {
    const { container } = render(<StatusBadge status={BusinessStatus.Pending} />)
    expect(container.firstChild).toHaveClass('bg-amber-100')
  })
})
