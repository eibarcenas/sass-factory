import { createApiClient } from '@eguru/client'

const LEGACY_API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const CATALOG_API_URL = import.meta.env.VITE_CATALOG_API_URL ?? LEGACY_API_URL
const IDENTITY_API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? LEGACY_API_URL
const DEMOS_API_URL = import.meta.env.VITE_DEMOS_API_URL ?? LEGACY_API_URL
const PROSPECTS_API_URL = import.meta.env.VITE_PROSPECTS_API_URL ?? LEGACY_API_URL

function resolveApiUrl(path: string): string {
  if (path.startsWith('/api/v1/auth/')) return IDENTITY_API_URL
  if (path.startsWith('/api/v1/demos/') || path === '/api/v1/admin/demos' || path === '/api/v1/admin/owners') {
    return DEMOS_API_URL
  }
  if (path.startsWith('/api/v1/prospects') || path.startsWith('/api/v1/admin/prospects')) return PROSPECTS_API_URL
  return CATALOG_API_URL
}

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

export const api = createApiClient({ baseUrl: resolveApiUrl, getToken })
