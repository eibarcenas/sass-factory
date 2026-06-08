import { useAuthStore } from '../store/auth'
import { localeFromPath } from '@/lib/routes'

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

export function useSignOut() {
  const store = useAuthStore()
  return async () => {
    const { getAuth, signOut } = await import('firebase/auth')
    const { initializeApp, getApps } = await import('firebase/app')
    if (!getApps().length) {
      initializeApp({
        apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
      })
    }
    await signOut(getAuth())
    store.setUser(null)
    window.location.replace(`${LANDING_URL}/${localeFromPath()}`)
  }
}
