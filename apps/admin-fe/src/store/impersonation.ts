import { create } from 'zustand'

interface ImpersonationState {
  impersonating: { businessId: string; businessName: string } | null
  startImpersonation: (businessId: string, businessName: string) => void
  stopImpersonation: () => void
}

export const useImpersonationStore = create<ImpersonationState>((set) => ({
  impersonating: null,
  startImpersonation: (businessId, businessName) => set({ impersonating: { businessId, businessName } }),
  stopImpersonation: () => set({ impersonating: null }),
}))
