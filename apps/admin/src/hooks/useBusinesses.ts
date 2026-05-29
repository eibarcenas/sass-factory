import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { businessApi } from '@/infrastructure/api/businessApi'
import type { Business } from '@eguru/core'

interface BusinessListResponse {
  businesses: Business[]
  total: number
}

export function useBusinesses(status?: string) {
  return useQuery<BusinessListResponse>({
    queryKey: ['businesses', status],
    queryFn: () => businessApi.list(status),
  })
}

export function useCreateDemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      type: string
      whatsapp: string
      city: string
      tagline?: string
      contactName?: string
    }) => api.post<Business>('/api/v1/admin/demos', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  })
}

export function useBusinessAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      businessApi.action(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  })
}
