import { create } from 'zustand'

interface AuthUser {
  uid: string
  email: string | null
}

interface AuthStore {
  user: AuthUser | null
  mockMode: boolean
  setUser: (user: AuthUser | null) => void
}

// mockMode = true when no Firebase credentials are configured
const MOCK_MODE = !import.meta.env.VITE_FIREBASE_API_KEY

export const useAuthStore = create<AuthStore>((set) => ({
  user: MOCK_MODE ? { uid: 'mock-admin', email: 'admin@catalog.mx' } : null,
  mockMode: MOCK_MODE,
  setUser: (user) => set({ user }),
}))
