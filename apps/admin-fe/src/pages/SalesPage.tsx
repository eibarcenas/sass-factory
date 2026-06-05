import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import KanbanBoard from '../components/dashboard/KanbanBoard'
import { Button } from '@/components/ui/button'
import type { Business } from '@eguru/core'
import { isLocale, routes } from '@/lib/routes'

export default function SalesPage() {
  const navigate = useNavigate()
  const { locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : 'es'

  function handleSelectBusiness(b: Business) {
    navigate(routes.platformBusiness(locale, b.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Businesses</h1>
        <Button size="sm" onClick={() => navigate(routes.platformBusinessNew(locale))}>
          + New business
        </Button>
      </div>

      <KanbanBoard onSelectBusiness={handleSelectBusiness} />
    </div>
  )
}
