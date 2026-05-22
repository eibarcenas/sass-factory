import { describe, it, expect } from 'vitest'
import { validateTransition, BusinessStatus } from '../types/business'

const { Draft, Demo, Sent, Accepted, Active, Suspended, Archived } = BusinessStatus

describe('validateTransition', () => {
  it('allows draft → demo', () => {
    expect(validateTransition(Draft, Demo).valid).toBe(true)
  })

  it('allows demo → sent', () => {
    expect(validateTransition(Demo, Sent).valid).toBe(true)
  })

  it('allows sent → accepted', () => {
    expect(validateTransition(Sent, Accepted).valid).toBe(true)
  })

  it('allows accepted → active', () => {
    expect(validateTransition(Accepted, Active).valid).toBe(true)
  })

  it('allows active → suspended', () => {
    expect(validateTransition(Active, Suspended).valid).toBe(true)
  })

  it('rejects active → demo (no going back)', () => {
    expect(validateTransition(Active, Demo).valid).toBe(false)
  })

  it('rejects active → draft', () => {
    expect(validateTransition(Active, Draft).valid).toBe(false)
  })

  it('rejects archived → active (terminal state)', () => {
    expect(validateTransition(Archived, Active).valid).toBe(false)
  })

  it('includes reason in failed transition', () => {
    const result = validateTransition(Active, Draft)
    if (!result.valid) {
      expect(result.reason).toContain('Cannot transition')
      expect(result.reason).toContain('active')
      expect(result.reason).toContain('draft')
    }
  })
})
