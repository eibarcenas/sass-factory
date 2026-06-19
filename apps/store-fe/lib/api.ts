import type { Business, Item, CatalogRequest } from '@eguru/core'

// API_URL: server-side only (no NEXT_PUBLIC_ prefix = configurable at runtime in Cloud Run)
// For local dev: http://localhost:8000
// For production: set API_URL env var in Cloud Run
const API_URL = process.env.STORES_API_URL ?? process.env.API_URL ?? process.env.NEXT_PUBLIC_STORES_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export type StoreData = Business & { items: Item[] }

export type LegalDocData = {
  slug: string
  docType: string
  businessName: string
  content: string
  updatedAt: string | null
}

export async function getLegalDoc(slug: string, docType: string): Promise<LegalDocData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/stores/${slug}/legal/${docType}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function getRequest(hash: string): Promise<CatalogRequest | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/requests/${hash}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export type StoreResult =
  | { type: 'ok'; data: StoreData }
  | { type: 'not_found' }
  | { type: 'suspended' }
  | { type: 'inactive'; name: string }
  | { type: 'error' }

export async function getStore(slug: string, review = false): Promise<StoreData | null> {
  const result = await getStoreResult(slug, review)
  if (result.type === 'ok') return result.data
  return null
}

export async function getStoreResult(slug: string, review = false): Promise<StoreResult> {
  try {
    const url = review
      ? `${API_URL}/api/v1/stores/${slug}?review=true`
      : `${API_URL}/api/v1/stores/${slug}`

    const res = await fetch(url, {
      next: review ? { revalidate: 0 } : { revalidate: 60 },
    })

    if (res.status === 404) return { type: 'not_found' }
    if (res.status === 410) return { type: 'suspended' }
    if (res.status === 403) {
      const body = await res.json().catch(() => ({}))
      if (body?.detail?.code === 'inactive') {
        return { type: 'inactive', name: body.detail.name ?? '' }
      }
      return { type: 'error' }
    }
    if (!res.ok) return { type: 'error' }
    return { type: 'ok', data: await res.json() }
  } catch {
    return { type: 'error' }
  }
}
