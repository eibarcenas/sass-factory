import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface Prospect {
  id: string
  businessId: string
  contactName?: string
  phone?: string
  email?: string
  status: 'new' | 'contacted' | 'accepted' | 'rejected'
  createdAt: string
}

export function useProspects(businessId?: string) {
  const path = businessId
    ? `/api/v1/admin/prospects?businessId=${businessId}`
    : '/api/v1/admin/prospects'

  return useQuery<{ prospects: Prospect[]; total: number }>({
    queryKey: ['prospects', businessId],
    queryFn: () => api.get(path),
    refetchInterval: 30_000, // poll every 30s for new prospects
  })
}
