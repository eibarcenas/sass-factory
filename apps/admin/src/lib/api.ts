import { createApiClient } from '@eguru/client'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function getToken(): Promise<string | null> {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return null
  try {
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    return auth.currentUser ? await auth.currentUser.getIdToken() : null
  } catch {
    return null
  }
}

export const api = createApiClient({ baseUrl: API_URL, getToken })
