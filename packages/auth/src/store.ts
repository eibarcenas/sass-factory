import { create } from 'zustand'
import type { AuthUser, AuthStore } from './types'

export interface CreateAuthStoreOptions {
  mockMode: boolean
  initialUser?: AuthUser | null
}

export function createAuthStore({ mockMode, initialUser = null }: CreateAuthStoreOptions) {
  return create<AuthStore>((set) => ({
    user: mockMode ? initialUser : null,
    mockMode,
    loading: false,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
  }))
}
