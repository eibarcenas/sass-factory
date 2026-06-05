import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KanbanBoard from '../components/dashboard/KanbanBoard'
import { Button } from '@/components/ui/button'
import type { Business } from '@eguru/core'

export default function SalesPage() {
  const navigate = useNavigate()

  function handleSelectBusiness(b: Business) {
    navigate(`/clientes/${b.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button size="sm" onClick={() => navigate('/clientes/new')}>
          + Nuevo negocio
        </Button>
      </div>

      <KanbanBoard onSelectBusiness={handleSelectBusiness} />
    </div>
  )
}
