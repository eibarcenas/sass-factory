'use client'

import { useEffect, useState } from 'react'
import type { CatalogRequest } from '@eguru/core'

type RequestItem = {
  product_id: string
  product_name: string
  quantity: number
  unit_price?: number
  total?: number
}

type StoredRequest = {
  hash: string
  storefront_slug: string
  items: RequestItem[]
  total?: number
  customer_message?: string
  created_at: string
  status: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-800' },
  reviewing: { label: 'En revisión', color: 'bg-blue-100 text-blue-800' },
  approved:  { label: 'Aprobado',    color: 'bg-green-100 text-green-800' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'bg-muted text-muted-foreground' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color}`}>
      {s.label}
    </span>
  )
}

export default function RequestDetail({
  token,
  serverRequest,
}: {
  token: string
  serverRequest: CatalogRequest | null
}) {
  const [localRequest, setLocalRequest] = useState<StoredRequest | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`catalog.mx.request.${token}`)
      if (raw) setLocalRequest(JSON.parse(raw))
    } catch {}
  }, [token])

  // Server data (from API) takes priority over localStorage
  const request = serverRequest ?? localRequest

  if (!request) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border bg-background p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold">Solicitud no encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta solicitud no existe o el enlace es incorrecto.
          </p>
        </div>
      </main>
    )
  }

  const slug = request.storefront_slug
  const status = request.status ?? 'pending'

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border bg-background p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Solicitud #{request.hash}
          </p>
          <StatusBadge status={status} />
        </div>
        <h1 className="mt-2 text-2xl font-bold">Detalle de solicitud</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {slug} · {new Date(request.created_at).toLocaleString('es-MX')}
        </p>

        <div className="mt-6 space-y-3">
          {request.items.map(item => (
            <div key={item.product_id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                </div>
                {typeof item.total === 'number' && (
                  <p className="text-sm font-bold">${item.total.toLocaleString('es-MX')} MXN</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {typeof request.total === 'number' && (
          <div className="mt-5 flex items-center justify-between border-t pt-4 font-bold">
            <span>Total</span>
            <span>${request.total.toLocaleString('es-MX')} MXN</span>
          </div>
        )}

        {request.customer_message && (
          <div className="mt-5 rounded-xl bg-muted p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Mensaje</p>
            <p className="mt-1 text-sm">{request.customer_message}</p>
          </div>
        )}
      </div>
    </main>
  )
}
