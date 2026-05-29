import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Business } from '@eguru/core'

interface BusinessListResponse {
  businesses: Business[]
  total: number
}

export function useBusinesses(status?: string) {
  const path = `/api/v1/admin/businesses${status ? `?status=${status}` : ''}`
  return useQuery<BusinessListResponse>({
    queryKey: ['businesses', status],
    queryFn: () => api.get(path),
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
      api.post(`/api/v1/admin/businesses/${id}/${action}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  })
}
