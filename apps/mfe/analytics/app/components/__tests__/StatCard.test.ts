import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatCard from '../StatCard.vue'

describe('StatCard', () => {
  it('renders label and value', () => {
    const wrapper = mount(StatCard, { props: { label: 'Visitas', value: 1234 } })
    expect(wrapper.text()).toContain('Visitas')
    expect(wrapper.text()).toContain('1')
  })

  it('shows trend arrow up when trendUp is true', () => {
    const wrapper = mount(StatCard, { props: { label: 'Clicks', value: 89, trend: '+12%', trendUp: true } })
    expect(wrapper.text()).toContain('↑')
  })

  it('shows trend arrow down when trendUp is false', () => {
    const wrapper = mount(StatCard, { props: { label: 'Clicks', value: 89, trend: '-5%', trendUp: false } })
    expect(wrapper.text()).toContain('↓')
  })
})
