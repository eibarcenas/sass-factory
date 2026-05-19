import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Input from '../Input.vue'

describe('Input', () => {
  it('renders label when provided', () => {
    const wrapper = mount(Input, { props: { label: 'Email', modelValue: '' } })
    expect(wrapper.text()).toContain('Email')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(Input, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('test@email.com')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test@email.com'])
  })

  it('shows error message when error prop provided', () => {
    const wrapper = mount(Input, { props: { modelValue: '', error: 'Required field' } })
    expect(wrapper.text()).toContain('Required field')
  })

  it('shows hint when hint prop provided', () => {
    const wrapper = mount(Input, { props: { modelValue: '', hint: 'Must be 8 chars' } })
    expect(wrapper.text()).toContain('Must be 8 chars')
  })
})
