import { createApiClient } from '@eguru/client'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function getToken(): Promise<string | null> {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return null
  try {
    const { getAuth } = await import('firebase/auth')
    const { initializeApp, getApps } = await import('firebase/app')
    if (!getApps().length) {
      initializeApp({
        apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
      })
    }
    const auth = getAuth()
    if (!auth.currentUser) return null
    return await auth.currentUser.getIdToken()
  } catch {
    return null
  }
}

export const api = createApiClient({ baseUrl: API_URL, getToken })
