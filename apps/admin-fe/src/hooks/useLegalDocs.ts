import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { legalApi } from '@/infrastructure/api/legalApi'
import type { LegalDocs, LegalDocType } from '@eguru/core'

const queryKey = (businessId: string, businessOverride?: string) =>
  ['seller-legal', businessId, businessOverride ?? null] as const

export function useLegalDocs(businessId: string, businessOverride?: string) {
  return useQuery<{ slug: string; legalDocs: LegalDocs }>({
    queryKey: queryKey(businessId, businessOverride),
    queryFn: () => legalApi.getDocs(businessOverride),
    enabled: !!businessId,
  })
}

export function useSaveLegalDoc(businessId: string, businessOverride?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ docType, content }: { docType: LegalDocType; content: string }) =>
      legalApi.update(docType, content, businessOverride),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(businessId, businessOverride) }),
  })
}

export function useGenerateLegalDoc(businessId: string, businessOverride?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ docType, description }: { docType: LegalDocType; description: string }) =>
      legalApi.generate(docType, description, businessOverride),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(businessId, businessOverride) }),
  })
}
