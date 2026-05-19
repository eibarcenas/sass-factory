import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from '../Card.vue'

describe('Card', () => {
  it('renders default slot', () => {
    const wrapper = mount(Card, { slots: { default: 'Card content' } })
    expect(wrapper.text()).toContain('Card content')
  })

  it('renders header slot when provided', () => {
    const wrapper = mount(Card, { slots: { header: 'Card Header', default: 'body' } })
    expect(wrapper.text()).toContain('Card Header')
  })

  it('renders footer slot when provided', () => {
    const wrapper = mount(Card, { slots: { footer: 'Card Footer', default: 'body' } })
    expect(wrapper.text()).toContain('Card Footer')
  })

  it('applies padding by default', () => {
    const wrapper = mount(Card, { slots: { default: 'test' } })
    expect(wrapper.html()).toContain('p-')
  })
})
