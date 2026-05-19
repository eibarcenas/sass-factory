import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LogoUpload from '../LogoUpload.vue'

describe('LogoUpload', () => {
  it('renders the upload area', () => {
    const wrapper = mount(LogoUpload)
    expect(wrapper.text()).toContain('Arrastra')
  })

  it('emits error for oversized file', async () => {
    const wrapper = mount(LogoUpload)
    const bigFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [bigFile], configurable: true })
    await input.trigger('change')
    expect(wrapper.emitted('error')).toBeTruthy()
    expect((wrapper.emitted('error')![0][0] as string)).toContain('grande')
  })

  it('emits error for SVG file (XSS risk)', async () => {
    const wrapper = mount(LogoUpload)
    const svgFile = new File(['<svg/>'], 'bad.svg', { type: 'image/svg+xml' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [svgFile], configurable: true })
    await input.trigger('change')
    expect(wrapper.emitted('error')).toBeTruthy()
    expect((wrapper.emitted('error')![0][0] as string)).toContain('Tipo no permitido')
  })
})
