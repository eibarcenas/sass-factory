import { api } from '@/lib/api'
import type { Business } from '@eguru/core'

export const businessApi = {
  list: (status?: string) =>
    api.get<{ businesses: Business[]; total: number }>(
      `/api/v1/platform/businesses${status ? `?status=${status}` : ''}`
    ),

  action: (id: string, action: string) =>
    api.post(`/api/v1/platform/businesses/${id}/actions/${action}`, {}),

  sellerUpdate: (patch: Partial<Business>, business?: string) =>
    api.patch(
      `/api/v1/seller/profile${business ? `?business=${business}` : ''}`,
      patch
    ),
}
