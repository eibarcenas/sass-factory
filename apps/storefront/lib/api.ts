import type { Business, Item } from '@/types/catalog'

// API_URL: server-side only (no NEXT_PUBLIC_ prefix = configurable at runtime in Cloud Run)
// For local dev: http://localhost:8000
// For production: set API_URL env var in Cloud Run
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export type CatalogData = Business & { items: Item[] }

export async function getCatalog(slug: string): Promise<CatalogData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/storefront/${slug}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    })
    if (res.status === 404 || res.status === 410) return null
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
