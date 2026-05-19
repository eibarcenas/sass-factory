import { describe, it, expect } from 'vitest'
import { createHmac, timingSafeEqual } from 'node:crypto'

function verifyMpSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

describe('MercadoPago webhook signature verification', () => {
  const SECRET = 'test-secret-key'
  const PAYLOAD = '{"type":"payment","data":{"id":"12345"}}'

  it('accepts valid HMAC-SHA256 signature', () => {
    const sig = createHmac('sha256', SECRET).update(PAYLOAD).digest('hex')
    expect(verifyMpSignature(PAYLOAD, sig, SECRET)).toBe(true)
  })

  it('rejects invalid signature', () => {
    expect(verifyMpSignature(PAYLOAD, 'invalid-signature-abc', SECRET)).toBe(false)
  })

  it('rejects signature with wrong secret', () => {
    const sig = createHmac('sha256', 'wrong-secret').update(PAYLOAD).digest('hex')
    expect(verifyMpSignature(PAYLOAD, sig, SECRET)).toBe(false)
  })

  it('rejects tampered payload', () => {
    const sig = createHmac('sha256', SECRET).update(PAYLOAD).digest('hex')
    const tampered = PAYLOAD.replace('12345', '99999')
    expect(verifyMpSignature(tampered, sig, SECRET)).toBe(false)
  })
})
