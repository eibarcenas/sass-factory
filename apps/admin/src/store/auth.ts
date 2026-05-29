import { createAuthStore } from '@eguru/auth'
import type { AuthUser } from '@eguru/auth'

export type UserRole = 'SUPER_ADMIN' | 'OWNER'
export type { AuthUser }

const MOCK_MODE = !import.meta.env.VITE_FIREBASE_API_KEY
const MOCK_ROLE = (import.meta.env.VITE_MOCK_ROLE ?? 'SUPER_ADMIN') as UserRole
const MOCK_BUSINESS_ID = import.meta.env.VITE_MOCK_BUSINESS_ID as string | undefined

function mockUser(): AuthUser {
  if (MOCK_ROLE === 'OWNER') {
    return {
      uid: 'mock-owner',
      email: 'owner@catalog.mx',
      displayName: 'Owner Demo',
      role: 'OWNER',
      businessId: MOCK_BUSINESS_ID ?? 'heladeria-el-pinguino',
      modules: ['CATALOG', 'APPEARANCE'],
    }
  }
  return { uid: 'mock-admin', email: 'admin@catalog.mx', displayName: 'Admin Demo', role: 'SUPER_ADMIN', modules: [] }
}

export const useAuthStore = createAuthStore({
  mockMode: MOCK_MODE,
  initialUser: MOCK_MODE ? mockUser() : null,
})
