import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AuthUser } from '@eguru/auth'

interface AccountSectionProps {
  user: AuthUser
  onSignOut: () => void
}

export default function AccountSection({ user, onSignOut }: AccountSectionProps) {
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
        <Button variant="outline" className="w-full mt-2" onClick={onSignOut}>
          Sign out
        </Button>
      </CardContent>
    </Card>
  )
}
