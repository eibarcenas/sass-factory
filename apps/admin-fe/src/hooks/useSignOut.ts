import { useAuthStore } from '../store/auth'
import { localeFromPath } from '@/lib/routes'

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

export function useSignOut() {
  const store = useAuthStore()
  return async () => {
    const [{ initializeApp, getApps, getApp }, { getAuth, signOut }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ])
    const app = getApps().length ? getApp() : initializeApp({
      apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
    })
    await signOut(getAuth(app))
    store.setUser(null)
    window.location.replace(`${LANDING_URL}/${localeFromPath()}`)
  }
}
