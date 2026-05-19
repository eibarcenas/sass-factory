import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../Button.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Click me' } })
    expect(wrapper.text()).toBe('Click me')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(Button, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('shows loading spinner when loading prop is true', () => {
    const wrapper = mount(Button, { props: { loading: true } })
    expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(true)
  })

  it('applies variant classes', () => {
    const wrapper = mount(Button, { props: { variant: 'danger' } })
    expect(wrapper.classes().join(' ')).toMatch(/red|danger/)
  })
})
