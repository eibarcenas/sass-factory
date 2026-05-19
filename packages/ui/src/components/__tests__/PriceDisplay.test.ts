import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PriceDisplay from '../PriceDisplay.vue'

describe('PriceDisplay', () => {
  it('formats price with MXN currency', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 85, currency: 'MXN' } })
    expect(wrapper.text()).toContain('85')
  })

  it('shows original price crossed out when provided', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 85, currency: 'MXN', originalPrice: 120 } })
    expect(wrapper.find('s, del, [data-testid="original-price"]').exists()).toBe(true)
  })
})
