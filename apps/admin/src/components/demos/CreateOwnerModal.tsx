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
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const ADMIN_URL = import.meta.env.VITE_ADMIN_URL
    ?? 'https://catalog-mx-admin-105288105956.us-central1.run.app'

  async function activate() {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await api.post('/api/v1/admin/owners', { email, businessId })
      setDone(true)
    } catch (err: any) {
      setError(err.message ?? 'Failed to activate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <Card className="relative w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-base">Activate owner</CardTitle>
          <p className="text-sm text-muted-foreground">{businessName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!done ? (
            <>
              <div className="space-y-1">
                <Label>Owner's Google email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="owner@gmail.com"
                />
                <p className="text-xs text-muted-foreground">
                  Must be a Google account they'll use to sign in.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={activate} disabled={loading || !email} className="flex-1">
                  {loading ? 'Activating...' : 'Activate'}
                </Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-green-800">✅ Owner activated!</p>
                <p className="text-xs text-green-700">
                  Send this message to <strong>{email}</strong>:
                </p>
                <div className="p-2 bg-white rounded border text-xs font-mono text-gray-700 leading-relaxed">
                  Your catalog is ready! 🎉{'\n'}
                  Log in here with your Google account:{'\n'}
                  {ADMIN_URL}
                </div>
              </div>
              <Button onClick={onClose} className="w-full">Done</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
