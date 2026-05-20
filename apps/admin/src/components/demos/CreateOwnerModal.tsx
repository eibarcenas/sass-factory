import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '../../lib/api'

interface Props {
  businessId: string
  businessName: string
  onClose: () => void
}

export default function CreateOwnerModal({ businessId, businessName, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ tempPassword: string } | null>(null)
  const [error, setError] = useState('')

  async function create() {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post<{ tempPassword: string }>('/api/v1/admin/owners', {
        email,
        businessId,
      })
      setResult(res)
    } catch (err: any) {
      setError(err.message ?? 'Failed to create owner account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <Card className="relative w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-base">Activate owner account</CardTitle>
          <p className="text-sm text-muted-foreground">{businessName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result ? (
            <>
              <div className="space-y-1">
                <Label>Owner email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="owner@business.com"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={create} disabled={loading || !email} className="flex-1">
                  {loading ? 'Creating...' : 'Create account'}
                </Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-800 mb-2">✅ Account created!</p>
                <p className="text-xs text-green-700">Send these credentials to the owner:</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-mono bg-white rounded px-2 py-1 border">Email: {email}</p>
                  <p className="text-xs font-mono bg-white rounded px-2 py-1 border">Password: {result.tempPassword}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The owner logs in at <strong>localhost:3000</strong> and is redirected to their dashboard automatically.
              </p>
              <Button onClick={onClose} className="w-full">Done</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
