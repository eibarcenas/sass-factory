import { createApiClient } from '@eguru/client'

const LEGACY_API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const STORES_API_URL = import.meta.env.VITE_STORES_API_URL ?? LEGACY_API_URL
const IDENTITY_API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? LEGACY_API_URL
const PROSPECTS_API_URL = import.meta.env.VITE_PROSPECTS_API_URL ?? LEGACY_API_URL

function resolveApiUrl(path: string): string {
  if (
    path.startsWith('/api/v1/auth/')
    || path.startsWith('/api/v1/business-registration-images')
    || path.startsWith('/api/v1/seller/profile')
  ) return IDENTITY_API_URL
  if (path.startsWith('/api/v1/prospects') || path.startsWith('/api/v1/platform/prospects')) return PROSPECTS_API_URL
  return STORES_API_URL
}

async function getToken(): Promise<string | null> {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return null
  try {
    const [{ initializeApp, getApps, getApp }, { getAuth }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ])
    const app = getApps().length ? getApp() : initializeApp({
      apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
    })
    const auth = getAuth(app)
    if (!auth.currentUser) return null
    return await auth.currentUser.getIdToken()
  } catch {
    return null
  }
}

export const api = createApiClient({ baseUrl: resolveApiUrl, getToken })
