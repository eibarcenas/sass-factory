'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'

const API_URL = process.env.NEXT_PUBLIC_STORES_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function AdminFloatingButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'activate' | 'archive' | null>(null)

  async function callAction(action: 'activate' | 'archive') {
    setLoading(action)
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch(`${API_URL}/api/v1/platform/businesses/${slug}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      router.refresh()
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      <div className="flex items-center gap-1 rounded-xl bg-zinc-900/80 backdrop-blur px-1.5 py-1">
        <span className="text-[10px] text-zinc-400 px-2 font-medium select-none">Admin</span>

        <button
          onClick={() => callAction('archive')}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
        >
          {loading === 'archive' ? (
            <span className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
          ) : (
            <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M7 7L2 2M7 7l5-5M7 7l5 5M7 7L2 12" strokeLinecap="round" />
            </svg>
          )}
          Archivar
        </button>

        <button
          onClick={() => callAction('activate')}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
        >
          {loading === 'activate' ? (
            <span className="h-3 w-3 rounded-full border border-white border-t-transparent animate-spin" />
          ) : (
            <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M2 7l3.5 3.5L12 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          Activar
        </button>
      </div>
    </div>
  )
}
