import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@eguru/ui'
import { api } from '../../lib/api'

interface DangerZoneSectionProps {
  onSignOut?: () => void
}

export default function DangerZoneSection({ onSignOut }: DangerZoneSectionProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await api.del('/api/v1/seller/profile')
      onSignOut?.()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently deletes your account and store. This action cannot be undone.
            </p>
          </div>
          {confirmDelete ? (
            <div className="flex gap-2 shrink-0">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete account
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
