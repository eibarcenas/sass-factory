import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Skeleton from '../Skeleton.vue'

describe('Skeleton', () => {
  it('renders with animate-pulse class', () => {
    const wrapper = mount(Skeleton)
    expect(wrapper.html()).toContain('animate-pulse')
  })

  it('renders card variant', () => {
    const wrapper = mount(Skeleton, { props: { variant: 'card' } })
    expect(wrapper.html()).toContain('rounded')
  })
})
