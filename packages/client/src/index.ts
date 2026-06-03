export interface ApiClientConfig {
  baseUrl: string | ((path: string) => string)
  getToken: () => Promise<string | null>
}

export interface ApiClient {
  get:    <T>(path: string) => Promise<T>
  post:   <T>(path: string, body: unknown) => Promise<T>
  patch:  <T>(path: string, body: unknown) => Promise<T>
  del:    <T>(path: string) => Promise<T>
  upload: <T>(path: string, form: FormData) => Promise<T>
}

export function createApiClient({ baseUrl, getToken }: ApiClientConfig): ApiClient {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken()
    const resolvedBaseUrl = typeof baseUrl === 'function' ? baseUrl(path) : baseUrl
    const res = await fetch(`${resolvedBaseUrl}${path}`, {
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
        new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`),
        { status: res.status, data: err }
      )
    }
    return res.json() as Promise<T>
  }

  async function upload<T>(path: string, form: FormData): Promise<T> {
    const token = await getToken()
    const resolvedBaseUrl = typeof baseUrl === 'function' ? baseUrl(path) : baseUrl
    const res = await fetch(`${resolvedBaseUrl}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw Object.assign(
        new Error((err as { detail?: string }).detail ?? `Upload failed: ${res.status}`),
        { status: res.status, data: err }
      )
    }
    return res.json() as Promise<T>
  }

  return {
    get:    <T>(path: string) => request<T>(path),
    post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
    patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
    del:    <T>(path: string) => request<T>(path, { method: 'DELETE' }),
    upload: <T>(path: string, form: FormData) => upload<T>(path, form),
  }
}
