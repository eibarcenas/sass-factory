import { describe, it, expect, vi } from 'vitest'

// Mock firebase-admin before importing requireAuth
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockImplementation((token: string) => {
      if (token === 'valid-admin-token') {
        return Promise.resolve({ uid: 'user-123', email: 'admin@test.com', role: 'admin' })
      }
      if (token === 'valid-owner-token') {
        return Promise.resolve({ uid: 'owner-456', email: 'owner@test.com', role: 'owner' })
      }
      return Promise.reject(new Error('Invalid token'))
    }),
  })),
}))

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
  cert: vi.fn(),
}))

import { requireAuth } from '../auth'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'

function makeEvent(authHeader?: string) {
  const req = new IncomingMessage(null as any)
  req.headers = authHeader ? { authorization: authHeader } : {}
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

describe('requireAuth', () => {
  it('throws 401 when Authorization header is missing', async () => {
    const event = makeEvent()
    await expect(requireAuth(event)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when token is not Bearer format', async () => {
    const event = makeEvent('Basic abc123')
    await expect(requireAuth(event)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when Firebase rejects the token', async () => {
    const event = makeEvent('Bearer invalid-token')
    await expect(requireAuth(event)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when role is insufficient', async () => {
    const event = makeEvent('Bearer valid-owner-token')
    await expect(
      requireAuth(event, { requiredRole: 'superadmin' }),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns user and sets event.context.user on success', async () => {
    const event = makeEvent('Bearer valid-admin-token')
    const user = await requireAuth(event)
    expect(user.uid).toBe('user-123')
    expect(user.role).toBe('admin')
    expect(event.context.user).toEqual(user)
  })
})
