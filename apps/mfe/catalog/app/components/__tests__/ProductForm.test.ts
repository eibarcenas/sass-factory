import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductForm from '../ProductForm.vue'

describe('ProductForm', () => {
  it('emits submit with form data when valid', async () => {
    const wrapper = mount(ProductForm)
    await wrapper.find('input[placeholder*="Sundae"]').setValue('Sundae de mango')
    await wrapper.find('input[type="number"]').setValue('75')
    await wrapper.findAll('button').at(-1)!.trigger('click')
    const emitted = wrapper.emitted('submit')
    expect(emitted?.[0]?.[0]).toMatchObject({ name: 'Sundae de mango', price: 75 })
  })

  it('shows error when name is empty', async () => {
    const wrapper = mount(ProductForm)
    await wrapper.findAll('button').at(-1)!.trigger('click')
    expect(wrapper.text()).toContain('requerido')
  })
})
