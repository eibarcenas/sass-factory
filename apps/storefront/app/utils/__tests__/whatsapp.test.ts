import { describe, it, expect } from 'vitest'
import { buildWhatsAppUrl } from '../whatsapp'

describe('buildWhatsAppUrl', () => {
  it('builds a valid WhatsApp URL', () => {
    const url = buildWhatsAppUrl('+521234567890', 'Sundae', 85)
    expect(url).toContain('wa.me/521234567890')
    expect(url).toContain('Sundae')
    expect(url).toContain('85')
  })

  it('normalizes phone without country code', () => {
    const url = buildWhatsAppUrl('1234567890', 'Paleta', 30)
    expect(url).toContain('wa.me/521234567890')
  })

  it('handles +52 prefix correctly', () => {
    const url = buildWhatsAppUrl('+521234567890', 'Test', 10)
    expect(url).not.toContain('5252') // should not double the prefix
  })
})
