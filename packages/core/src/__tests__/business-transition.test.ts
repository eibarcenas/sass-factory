import { describe, it, expect } from 'vitest'
import { validateTransition } from '../types/business'

describe('validateTransition', () => {
  it('allows draft → demo', () => {
    const result = validateTransition('draft', 'demo')
    expect(result.valid).toBe(true)
  })

  it('allows demo → sent', () => {
    const result = validateTransition('demo', 'sent')
    expect(result.valid).toBe(true)
  })

  it('allows sent → accepted', () => {
    const result = validateTransition('sent', 'accepted')
    expect(result.valid).toBe(true)
  })

  it('allows accepted → active', () => {
    const result = validateTransition('accepted', 'active')
    expect(result.valid).toBe(true)
  })

  it('allows active → suspended', () => {
    const result = validateTransition('active', 'suspended')
    expect(result.valid).toBe(true)
  })

  it('rejects active → demo (no going back)', () => {
    const result = validateTransition('active', 'demo')
    expect(result.valid).toBe(false)
  })

  it('rejects active → draft', () => {
    const result = validateTransition('active', 'draft')
    expect(result.valid).toBe(false)
  })

  it('rejects archived → active (terminal state)', () => {
    const result = validateTransition('archived', 'active')
    expect(result.valid).toBe(false)
  })

  it('includes reason in failed transition', () => {
    const result = validateTransition('active', 'draft')
    if (!result.valid) {
      expect(result.reason).toContain('Cannot transition')
      expect(result.reason).toContain('active')
      expect(result.reason).toContain('draft')
    }
  })
})
