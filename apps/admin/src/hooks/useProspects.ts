import { useQuery } from '@tanstack/react-query'
import { prospectApi } from '@/infrastructure/api/prospectApi'
import type { Prospect } from '@eguru/core'

export function useProspects(businessId?: string) {
  return useQuery<{ prospects: Prospect[]; total: number }>({
    queryKey: ['prospects', businessId],
    queryFn: () => prospectApi.list(businessId),
    refetchInterval: 30_000,
  })
}
