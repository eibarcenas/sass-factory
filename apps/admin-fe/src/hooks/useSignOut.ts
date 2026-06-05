import { useAuthStore } from '../store/auth'
import { localeFromPath } from '@/lib/routes'

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

export function useSignOut() {
  const store = useAuthStore()
  return async () => {
    const { getAuth, signOut } = await import('firebase/auth')
    await signOut(getAuth())
    store.setUser(null)
    window.location.replace(`${LANDING_URL}/${localeFromPath()}`)
  }
}
