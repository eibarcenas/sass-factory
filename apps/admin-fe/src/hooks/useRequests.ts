import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { CatalogRequest, RequestStatus } from '@eguru/core'

export function useRequests() {
  return useQuery<{ requests: CatalogRequest[] }>({
    queryKey: ['owner-requests'],
    queryFn: () => api.get('/api/v1/owner/requests'),
  })
}

export function useUpdateRequestStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ hash, status }: { hash: string; status: RequestStatus }) =>
      api.patch(`/api/v1/owner/requests/${hash}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-requests'] }),
  })
}
