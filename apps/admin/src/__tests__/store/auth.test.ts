import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/auth'

beforeEach(() => {
  useAuthStore.setState({ user: null, mockMode: false, loading: false })
})

describe('useAuthStore', () => {
  it('setUser stores the user', () => {
    const user = { uid: 'u1', email: 'a@b.com', role: 'SUPER_ADMIN' as const, modules: [] }
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('setUser(null) clears the user', () => {
    useAuthStore.setState({ user: { uid: 'u1', email: 'a@b.com', role: 'SUPER_ADMIN', modules: [] } })
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setLoading toggles loading flag', () => {
    useAuthStore.getState().setLoading(true)
    expect(useAuthStore.getState().loading).toBe(true)
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().loading).toBe(false)
  })

  it('OWNER user carries businessId', () => {
    const owner = { uid: 'o1', email: 'owner@biz.com', role: 'OWNER' as const, businessId: 'biz-123', modules: [] }
    useAuthStore.getState().setUser(owner)
    expect(useAuthStore.getState().user?.businessId).toBe('biz-123')
  })
})
