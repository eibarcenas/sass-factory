'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function OwnerApproveButton({ slug }: { slug: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleApprove() {
    setState('loading')
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch(`${API_URL}/api/v1/owner/business/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setState('done')
    } catch {
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm font-medium text-emerald-700">
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.78 5.78-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47 3.97-3.97a.75.75 0 1 1 1.06 1.06z" />
        </svg>
        Aprobado
      </div>
    )
  }

  return (
    <button
      onClick={handleApprove}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
    >
      {state === 'loading' ? (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
      ) : (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.78 5.78-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47 3.97-3.97a.75.75 0 1 1 1.06 1.06z" />
        </svg>
      )}
      {state === 'loading' ? 'Aprobando...' : 'Aprobar catálogo'}
    </button>
  )
}
