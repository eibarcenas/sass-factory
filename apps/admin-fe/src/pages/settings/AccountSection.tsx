import { Card, CardContent, CardHeader, CardTitle, Badge } from '@eguru/ui'
import type { AuthUser } from '@eguru/auth'

interface AccountSectionProps {
  user: AuthUser
}

export default function AccountSection({ user }: AccountSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account</CardTitle>
        <p className="text-xs text-muted-foreground">Signed in with Google</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
          <span className="text-sm text-muted-foreground">Name</span>
          <span className="text-sm">{user.displayName ?? user.email ?? ''}</span>
        </div>
        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
          <span className="text-sm text-muted-foreground">Email</span>
          <span className="text-sm">{user.email ?? ''}</span>
        </div>
        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
          <span className="text-sm text-muted-foreground">Role</span>
          <Badge variant="secondary" className="w-fit">{user.role}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
