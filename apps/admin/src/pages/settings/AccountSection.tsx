import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { api } from '../../lib/api'
import type { AuthUser } from '@eguru/auth'

interface AccountSectionProps {
  user: AuthUser
  onSignOut?: () => void
}

export default function AccountSection({ user, onSignOut }: AccountSectionProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await api.del('/api/v1/owner/account')
      onSignOut?.()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account</CardTitle>
        <p className="text-xs text-muted-foreground">Signed in with Google</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input
            value={user.displayName ?? user.email ?? ''}
            readOnly
            className="text-muted-foreground"
          />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input
            value={user.email ?? ''}
            readOnly
            className="text-muted-foreground"
          />
        </div>
        <div className="space-y-1">
          <Label>Role</Label>
          <div>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        </div>
        {onSignOut && (
          <Button variant="outline" className="w-full" onClick={onSignOut}>
            Sign out
          </Button>
        )}
        {user.role === 'OWNER' && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Permanently deletes your account and catalog. This action cannot be undone.
              </p>
              {confirmDelete ? (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete my account'}
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
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete account
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
