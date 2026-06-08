import { describe, expect, it } from 'vitest'
import { BusinessType } from '@eguru/core'
import {
  getRegistrationStepError,
  isRegistrationComplete,
} from '@/components/businesses/BusinessFormPanel'
import { isDraftProductComplete, type DraftProduct } from '@/components/catalog/ProductEditor'
import type { BusinessFormValues } from '@/components/businesses/hooks/useBusinessFormState'

const values: BusinessFormValues = {
  logo: 'https://example.com/logo.jpg',
  type: BusinessType.Restaurante,
  name: 'Cocina Norte',
  contactName: 'Ana Pérez',
  whatsapp: '+525512345678',
  ownerEmail: '',
  city: 'Monterrey',
  state: 'Nuevo León',
}

const product: DraftProduct = {
  id: 'draft-1',
  name: 'Tacos',
  price: 95,
  description: 'Orden de tres tacos',
  images: ['https://example.com/tacos.jpg'],
}

describe('business registration completeness', () => {
  it('requires every business field, a complete product and accepted terms', () => {
    expect(isRegistrationComplete(values, 'available', [product], true)).toBe(true)
    expect(isRegistrationComplete({ ...values, logo: '' }, 'available', [product], true)).toBe(false)
    expect(isRegistrationComplete(values, 'available', [], true)).toBe(false)
    expect(isRegistrationComplete(values, 'available', [product], false)).toBe(false)
  })

  it('requires product description and image', () => {
    expect(isDraftProductComplete(product)).toBe(true)
    expect(isDraftProductComplete({ ...product, description: '' })).toBe(false)
    expect(isDraftProductComplete({ ...product, images: [] })).toBe(false)
  })

  it('validates each registration step independently', () => {
    expect(getRegistrationStepError(0, values, 'available', [product])).toBe('')
    expect(getRegistrationStepError(0, { ...values, logo: '' }, 'available', [product])).toMatch(/logo/i)
    expect(getRegistrationStepError(1, values, 'available', [product])).toBe('')
    expect(getRegistrationStepError(1, { ...values, city: '' }, 'available', [product])).toMatch(/ciudad/i)
    expect(getRegistrationStepError(2, values, 'available', [])).toMatch(/producto/i)
  })
})
