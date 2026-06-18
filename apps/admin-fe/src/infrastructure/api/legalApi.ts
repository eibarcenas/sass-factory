import { api } from '@/lib/api'
import type { LegalDocs, LegalDocType, LegalDocument } from '@eguru/core'

function suffix(businessOverride?: string): string {
  return businessOverride ? `?business=${businessOverride}` : ''
}

export interface LegalDocResult {
  slug: string
  docType: LegalDocType
  document: LegalDocument
}

export const legalApi = {
  getDocs: (businessOverride?: string) =>
    api.get<{ slug: string; legalDocs: LegalDocs }>(`/api/v1/seller/legal${suffix(businessOverride)}`),

  update: (docType: LegalDocType, content: string, businessOverride?: string) =>
    api.patch<LegalDocResult>(`/api/v1/seller/legal${suffix(businessOverride)}`, { docType, content }),

  generate: (docType: LegalDocType, description: string, businessOverride?: string) =>
    api.post<LegalDocResult>(`/api/v1/seller/legal/generate${suffix(businessOverride)}`, { docType, description }),
}
