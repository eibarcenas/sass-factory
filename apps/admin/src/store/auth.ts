import { create } from 'zustand'

export type UserRole = 'SUPER_ADMIN' | 'OWNER'

export interface AuthUser {
  uid: string
  email: string | null
  role: UserRole
  businessId?: string  // set when role === 'OWNER'
  modules: string[]
}

interface AuthStore {
  user: AuthUser | null
  mockMode: boolean
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
}

const MOCK_MODE = !import.meta.env.VITE_FIREBASE_API_KEY

export const useAuthStore = create<AuthStore>((set) => ({
  user: MOCK_MODE
    ? { uid: 'mock-admin', email: 'admin@catalog.mx', role: 'SUPER_ADMIN', modules: [] }
    : null,
  mockMode: MOCK_MODE,
  loading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
