'use client'

import { useEffect, useState } from 'react'

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

export default function RequestDetail({ hash }: { hash: string }) {
  const [request, setRequest] = useState<StoredRequest | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`catalog.mx.request.${hash}`)
      if (raw) setRequest(JSON.parse(raw))
    } catch {}
  }, [hash])

  if (!request) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border bg-background p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold">Solicitud no encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta vista local aparece cuando la solicitud fue creada en este dispositivo.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border bg-background p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Solicitud #{request.hash}
        </p>
        <h1 className="mt-2 text-2xl font-bold">Detalle de solicitud</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {request.storefront_slug} · {new Date(request.created_at).toLocaleString('es-MX')}
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
