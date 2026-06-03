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

// ── Owner-scoped hooks (call /owner/business/items — auth via JWT) ────────────

export function useOwnerItems(businessId: string, previewSlug?: string) {
  return useQuery<{ items: Item[] }>({
    queryKey: ['owner-items', businessId, previewSlug ?? null],
    queryFn: () => itemApi.ownerList(previewSlug),
    enabled: !!businessId,
  })
}

export function useOwnerAddItem(businessId: string, businessOverride?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Item>) => itemApi.ownerAdd(data, businessOverride),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}

export function useOwnerUpdateItem(businessId: string, businessOverride?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: Partial<Item> }) =>
      itemApi.ownerUpdate(itemId, patch, businessOverride),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}

export function useOwnerDeleteItem(businessId: string, businessOverride?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => itemApi.ownerDelete(itemId, businessOverride),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', businessId] }),
  })
}
