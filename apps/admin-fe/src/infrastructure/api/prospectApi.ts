import { api } from '@/lib/api'
import type { Prospect } from '@eguru/core'

export const prospectApi = {
  list: (businessId?: string) =>
    api.get<{ prospects: Prospect[]; total: number }>(
      `/api/v1/platform/prospects${businessId ? `?businessId=${businessId}` : ''}`
    ),
}
