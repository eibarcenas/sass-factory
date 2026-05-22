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
const MOCK_ROLE = (import.meta.env.VITE_MOCK_ROLE ?? 'SUPER_ADMIN') as UserRole
const MOCK_BUSINESS_ID = import.meta.env.VITE_MOCK_BUSINESS_ID as string | undefined

function mockUser(): AuthUser {
  if (MOCK_ROLE === 'OWNER') {
    return {
      uid: 'mock-owner',
      email: 'owner@catalog.mx',
      role: 'OWNER',
      businessId: MOCK_BUSINESS_ID ?? 'heladeria-el-pinguino',
      modules: ['CATALOG', 'APPEARANCE'],
    }
  }
  return { uid: 'mock-admin', email: 'admin@catalog.mx', role: 'SUPER_ADMIN', modules: [] }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: MOCK_MODE ? mockUser() : null,
  mockMode: MOCK_MODE,
  loading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
