import type { Business, Item } from '@catalog-mx/core'

// API_URL: server-side only (no NEXT_PUBLIC_ prefix = configurable at runtime in Cloud Run)
// For local dev: http://localhost:8000
// For production: set API_URL env var in Cloud Run
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export type CatalogData = Business & { items: Item[] }

export type CatalogResult =
  | { type: 'ok'; data: CatalogData }
  | { type: 'not_found' }
  | { type: 'suspended' }
  | { type: 'error' }

export async function getCatalog(slug: string, isDemoMode = false): Promise<CatalogData | null> {
  const result = await getCatalogResult(slug, isDemoMode)
  if (result.type === 'ok') return result.data
  return null
}

export async function getCatalogResult(slug: string, isDemoMode = false): Promise<CatalogResult> {
  try {
    const res = await fetch(`${API_URL}/api/v1/storefront/${slug}`, {
      // Demo pages: no cache (demos change often during sales flow)
      // Active catalog pages: ISR 60s
      next: isDemoMode ? { revalidate: 0 } : { revalidate: 60 },
    })
    if (res.status === 404) return { type: 'not_found' }
    if (res.status === 410) return { type: 'suspended' }
    if (!res.ok) return { type: 'error' }
    return { type: 'ok', data: await res.json() }
  } catch {
    return { type: 'error' }
  }
}
