import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from '../Badge.vue'

describe('Badge', () => {
  it('renders slot content', () => {
    const wrapper = mount(Badge, { slots: { default: 'Active' } })
    expect(wrapper.text()).toBe('Active')
  })

  it('applies success variant styles', () => {
    const wrapper = mount(Badge, { props: { variant: 'success' } })
    expect(wrapper.classes().join(' ')).toMatch(/green|success/)
  })

  it('applies error variant styles', () => {
    const wrapper = mount(Badge, { props: { variant: 'error' } })
    expect(wrapper.classes().join(' ')).toMatch(/red|error/)
  })
})
