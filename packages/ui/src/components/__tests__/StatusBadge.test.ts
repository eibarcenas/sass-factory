import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '../StatusBadge.vue'
import type { BusinessStatus } from '@sass-factory/core'

describe('StatusBadge', () => {
  const statuses: BusinessStatus[] = ['draft', 'demo', 'sent', 'accepted', 'active', 'suspended']

  statuses.forEach((status) => {
    it(`renders ${status} status`, () => {
      const wrapper = mount(StatusBadge, { props: { status } })
      expect(wrapper.text().toLowerCase()).toContain(status)
    })
  })

  it('renders active with green styling', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'active' } })
    expect(wrapper.classes().join(' ')).toMatch(/green|emerald/)
  })

  it('renders suspended with red styling', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'suspended' } })
    expect(wrapper.classes().join(' ')).toMatch(/red/)
  })

  it('renders draft with gray styling', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'draft' } })
    expect(wrapper.classes().join(' ')).toMatch(/gray|slate/)
  })
})
