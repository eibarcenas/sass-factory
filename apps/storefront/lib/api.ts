import type { Business, Item } from '@catalog-mx/core'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

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
