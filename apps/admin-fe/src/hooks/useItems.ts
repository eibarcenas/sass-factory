import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itemApi } from '@/infrastructure/api/itemApi'
import type { Item } from '@eguru/core'

export type { Item }

export function useItems(businessId: string) {
  return useQuery<{ items: Item[] }>({
    queryKey: ['items', businessId],
    queryFn: () => itemApi.list(businessId),
    enabled: !!businessId,
  })
}

export function useAddItem(businessId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Item>) => itemApi.add(businessId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}

export function useUpdateItem(businessId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: Partial<Item> }) =>
      itemApi.update(businessId, itemId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}

export function useDeleteItem(businessId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => itemApi.delete(businessId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}

// ── Seller-scoped hooks (auth via JWT) ────────────

export function useSellerItems(businessId: string, reviewSlug?: string) {
  return useQuery<{ items: Item[] }>({
    queryKey: ['owner-items', businessId, reviewSlug ?? null],
    queryFn: () => itemApi.sellerList(reviewSlug),
    enabled: !!businessId,
  })
}

export function useSellerAddItem(businessId: string, businessOverride?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Item>) => itemApi.sellerAdd(data, businessOverride),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}

export function useSellerUpdateItem(businessId: string, businessOverride?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: Partial<Item> }) =>
      itemApi.sellerUpdate(itemId, patch, businessOverride),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}

export function useSellerDeleteItem(businessId: string, businessOverride?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => itemApi.sellerDelete(itemId, businessOverride),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}
