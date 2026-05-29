export interface AuthUser {
  uid: string
  email: string | null
  displayName?: string | null
  photoURL?: string | null
  role: string
  businessId?: string
  modules: string[]
}

export interface AuthStore {
  user: AuthUser | null
  mockMode: boolean
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
}
