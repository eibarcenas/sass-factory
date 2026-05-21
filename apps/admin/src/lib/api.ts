const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function getToken(): Promise<string | null> {
  // Mock mode — no Firebase, API uses DEV_USER_EMAIL bypass
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return null
  try {
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    return auth.currentUser ? await auth.currentUser.getIdToken() : null
  } catch {
    return null
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(
      new Error(err.detail ?? `Request failed: ${res.status}`),
      { status: res.status, data: err }
    )
  }
  return res.json()
}

export const api = {
  get:   <T>(path: string)                => request<T>(path),
  post:  <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del:   <T>(path: string)                => request<T>(path, { method: 'DELETE' }),
}
