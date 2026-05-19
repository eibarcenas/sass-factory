import { describe, it, expect } from 'vitest'
import { validateTransition } from '@sass-factory/core'

describe('business lifecycle transitions via validateTransition', () => {
  it('draft → demo is valid (publish action)', () => {
    expect(validateTransition('draft', 'demo').valid).toBe(true)
  })

  it('demo → sent is valid (send action)', () => {
    expect(validateTransition('demo', 'sent').valid).toBe(true)
  })

  it('accepted → active is valid (activate action)', () => {
    expect(validateTransition('accepted', 'active').valid).toBe(true)
  })

  it('active → suspended is valid (suspend action)', () => {
    expect(validateTransition('active', 'suspended').valid).toBe(true)
  })

  it('active → demo is invalid (422)', () => {
    const result = validateTransition('active', 'demo')
    expect(result.valid).toBe(false)
    expect('reason' in result && result.reason).toBeTruthy()
  })

  it('archived → active is invalid', () => {
    expect(validateTransition('archived', 'active').valid).toBe(false)
  })
})
