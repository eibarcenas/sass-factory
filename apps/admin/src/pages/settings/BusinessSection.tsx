import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface BusinessSectionProps {
  currentWhatsapp?: string
}

export default function BusinessSection({ currentWhatsapp }: BusinessSectionProps) {
  const [whatsapp, setWhatsapp] = useState(currentWhatsapp ?? '')
  const [saved, setSaved] = useState(false)
  const qc = useQueryClient()

  const save = useMutation({
    mutationFn: () => api.patch(`/api/v1/owner/business`, { whatsapp }),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      qc.invalidateQueries({ queryKey: ['owner-business'] })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>WhatsApp number</Label>
          <Input
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="+52 55 1234 5678"
          />
        </div>
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          {saved ? '✓ Saved' : save.isPending ? 'Saving...' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  )
}
