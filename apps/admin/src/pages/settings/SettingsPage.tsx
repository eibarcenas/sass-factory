import { useAuthStore } from '../../store/auth'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import AccountSection from './AccountSection'
import BusinessSection from './BusinessSection'
import { BusinessStatus } from '@eguru/core'

export default function SettingsPage() {
  const { user } = useAuthStore()

  const { data: bizData } = useQuery({
    queryKey: ['owner-business', user?.businessId],
    queryFn: () =>
      api.get<{ name: string; slug: string; tagline?: string; whatsapp?: string; status: BusinessStatus; whatsappClicks?: number }>(
        `/api/v1/storefront/${user!.businessId}`
      ),
    enabled: user?.role === 'OWNER' && !!user?.businessId,
  })

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>
      <AccountSection user={user} />
      {user.role === 'OWNER' && (
        <BusinessSection currentWhatsapp={bizData?.whatsapp} />
      )}
    </div>
  )
}
