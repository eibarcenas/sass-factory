import { api } from '@/lib/api'
import type { Item } from '@eguru/core'

export const itemApi = {
  list: (businessId: string) =>
    api.get<{ items: Item[] }>(`/api/v1/admin/businesses/${businessId}/items`),

  add: (businessId: string, data: Partial<Item>) =>
    api.post<Item>(`/api/v1/admin/businesses/${businessId}/items`, data),

  update: (businessId: string, itemId: string, patch: Partial<Item>) =>
    api.patch<Item>(`/api/v1/admin/businesses/${businessId}/items/${itemId}`, patch),

  delete: (businessId: string, itemId: string) =>
    api.del(`/api/v1/admin/businesses/${businessId}/items/${itemId}`),

  ownerList: (previewSlug?: string) =>
    api.get<{ items: Item[] }>(
      `/api/v1/owner/business/items${previewSlug ? `?business=${previewSlug}` : ''}`
    ),

  ownerAdd: (data: Partial<Item>, businessOverride?: string) =>
    api.post<Item>(
      `/api/v1/owner/business/items${businessOverride ? `?business=${businessOverride}` : ''}`,
      data
    ),

  ownerUpdate: (itemId: string, patch: Partial<Item>, businessOverride?: string) =>
    api.patch<Item>(
      `/api/v1/owner/business/items/${itemId}${businessOverride ? `?business=${businessOverride}` : ''}`,
      patch
    ),

  ownerDelete: (itemId: string, businessOverride?: string) =>
    api.del(
      `/api/v1/owner/business/items/${itemId}${businessOverride ? `?business=${businessOverride}` : ''}`
    ),
}
