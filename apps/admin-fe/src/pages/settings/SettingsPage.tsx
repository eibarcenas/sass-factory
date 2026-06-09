import { useAuthStore } from '../../store/auth'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import AccountSection from './AccountSection'
import BusinessSection from './BusinessSection'
import DangerZoneSection from './DangerZoneSection'
import { Button } from '@eguru/ui'
import { BusinessStatus } from '@eguru/core'

interface SettingsPageProps {
  onSignOut?: () => void | Promise<void>
}

export default function SettingsPage({ onSignOut }: SettingsPageProps) {
  const { user } = useAuthStore()

  const { data: bizData } = useQuery({
    queryKey: ['owner-business', user?.businessId],
    queryFn: () =>
      api.get<{ name: string; slug: string; tagline?: string; whatsapp?: string; status: BusinessStatus; whatsappClicks?: number }>(
        `/api/v1/stores/${user!.businessId}`
      ),
    enabled: user?.role === 'OWNER' && !!user?.businessId,
  })

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
        </div>
        {onSignOut && (
          <Button variant="outline" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        )}
      </div>
      <AccountSection user={user} />
      {user.role === 'OWNER' && (
        <BusinessSection currentWhatsapp={bizData?.whatsapp} />
      )}
      {user.role === 'OWNER' && (
        <DangerZoneSection onSignOut={onSignOut} />
      )}
    </div>
  )
}
