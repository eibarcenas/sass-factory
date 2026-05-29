export interface AuthUser {
  uid: string
  email: string | null
  role: string
  businessId?: string
  displayName?: string
  modules: string[]
}

export interface AuthStore {
  user: AuthUser | null
  mockMode: boolean
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
}
