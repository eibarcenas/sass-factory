import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface Item {
  id: string
  businessId: string
  name: string
  price: number
  currency: string
  description?: string
  image?: string
  visible: boolean
  order: number
}

export function useItems(businessId: string) {
  return useQuery<{ items: Item[] }>({
    queryKey: ['items', businessId],
    queryFn: () => api.get(`/api/v1/admin/businesses/${businessId}/items`),
    enabled: !!businessId,
  })
}

export function useAddItem(businessId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Item>) =>
      api.post<Item>(`/api/v1/admin/businesses/${businessId}/items`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}

export function useUpdateItem(businessId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: Partial<Item> }) =>
      api.patch<Item>(`/api/v1/admin/businesses/${businessId}/items/${itemId}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}

export function useDeleteItem(businessId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) =>
      api.del(`/api/v1/admin/businesses/${businessId}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}
