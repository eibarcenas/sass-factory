import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/ui/StatusBadge'
import { BusinessStatus } from '@catalog-mx/core'

const STATUSES: [BusinessStatus, string][] = [
  [BusinessStatus.Draft,     'Draft'],
  [BusinessStatus.Demo,      'Demo'],
  [BusinessStatus.Sent,      'Sent'],
  [BusinessStatus.Accepted,  'Accepted'],
  [BusinessStatus.Active,    'Active'],
  [BusinessStatus.Suspended, 'Suspended'],
  [BusinessStatus.Expired,   'Expired'],
  [BusinessStatus.Archived,  'Archived'],
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

  it('applies color class for suspended status', () => {
    const { container } = render(<StatusBadge status={BusinessStatus.Suspended} />)
    expect(container.firstChild).toHaveClass('bg-red-100')
  })

  it('applies color class for draft status', () => {
    const { container } = render(<StatusBadge status={BusinessStatus.Draft} />)
    expect(container.firstChild).toHaveClass('bg-slate-100')
  })
})
