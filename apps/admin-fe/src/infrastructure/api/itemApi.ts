import { api } from '@/lib/api'
import type { Item } from '@eguru/core'

export const itemApi = {
  list: (businessId: string) =>
    api.get<{ items: Item[] }>(`/api/v1/platform/businesses/${businessId}/products`),

  add: (businessId: string, data: Partial<Item>) =>
    api.post<Item>(`/api/v1/platform/businesses/${businessId}/products`, data),

  update: (businessId: string, itemId: string, patch: Partial<Item>) =>
    api.patch<Item>(`/api/v1/platform/businesses/${businessId}/products/${itemId}`, patch),

  delete: (businessId: string, itemId: string) =>
    api.del(`/api/v1/platform/businesses/${businessId}/products/${itemId}`),

  sellerList: (reviewSlug?: string) =>
    api.get<{ items: Item[] }>(
      `/api/v1/seller/products${reviewSlug ? `?business=${reviewSlug}` : ''}`
    ),

  sellerAdd: (data: Partial<Item>, businessOverride?: string) =>
    api.post<Item>(
      `/api/v1/seller/products${businessOverride ? `?business=${businessOverride}` : ''}`,
      data
    ),

  sellerUpdate: (itemId: string, patch: Partial<Item>, businessOverride?: string) =>
    api.patch<Item>(
      `/api/v1/seller/products/${itemId}${businessOverride ? `?business=${businessOverride}` : ''}`,
      patch
    ),

  sellerDelete: (itemId: string, businessOverride?: string) =>
    api.del(
      `/api/v1/seller/products/${itemId}${businessOverride ? `?business=${businessOverride}` : ''}`
    ),
}
