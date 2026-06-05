import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BusinessFormValues } from './useBusinessFormState'

export function useUpdateBusiness(businessSlug?: string) {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: (values: Partial<BusinessFormValues>) => {
      const qs = businessSlug ? `?business=${businessSlug}` : ''
      return api.patch(`/api/v1/seller/profile${qs}`, {
        logo:     values.logo     || undefined,
        type:     values.type     || undefined,
        name:     values.name,
        whatsapp: values.whatsapp || undefined,
        city:     values.city     || undefined,
        state:    values.state    || undefined,
        tagline:  values.tagline  || undefined,
      })
    },
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      qc.invalidateQueries({ queryKey: ['businesses'] })
      qc.invalidateQueries({ queryKey: ['seller-profile'] })
    },
  })

  return {
    save:      (values: Partial<BusinessFormValues>) => mutation.mutate(values),
    isPending: mutation.isPending,
    saved,
  }
}
