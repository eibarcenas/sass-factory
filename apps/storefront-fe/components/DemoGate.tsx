'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { BusinessStatus } from '@eguru/core'
import AuthWall from './AuthWall'
import ReviewBadge from './ReviewBadge'
import OwnerApproveButton from './OwnerApproveButton'
import AdminFloatingButton from './AdminFloatingButton'
import type { CatalogData } from '@/lib/api'
import CatalogView from './CatalogView'

type Role = 'super_admin' | 'owner' | 'other' | null

interface Props {
  slug: string
  data: CatalogData
}

export default function DemoGate({ slug, data }: Props) {
  const [role, setRole] = useState<Role>(undefined as unknown as Role)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setRole(null); return }
      try {
        const { claims } = await user.getIdTokenResult()
        const r = claims.role as string | undefined
        if (r === 'SUPER_ADMIN') setRole('super_admin')
        else if (r === 'OWNER' && claims.business_id === slug) setRole('owner')
        else setRole('other')
      } catch {
        setRole('other')
      }
    })
    return unsub
  }, [slug])

  // Still checking auth state
  if (role === (undefined as unknown as Role)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF9F6' }}>
        <span className="h-6 w-6 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (role === null) return <AuthWall slug={slug} />

  // Logged in but wrong owner
  if (role === 'other') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#FAF9F6' }}>
        <div className="text-center space-y-2 max-w-xs">
          <p className="font-semibold text-zinc-900">Sin acceso</p>
          <p className="text-sm text-zinc-500">Esta vista previa no está disponible para tu cuenta.</p>
          <a href="https://catalog.mx" className="inline-block text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            catalog.mx
          </a>
        </div>
      </div>
    )
  }

  const isReview = data.status === BusinessStatus.Review || data.status === BusinessStatus.PendingReview

  return (
    <>
      {isReview && <ReviewBadge />}

      {/* Push content below the fixed banner */}
      <div className={isReview ? 'pt-9' : ''}>
        <CatalogView data={data} isDemo />
      </div>

      {/* Owner approve button — floats above catalog content */}
      {role === 'owner' && isReview && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <OwnerApproveButton slug={slug} />
        </div>
      )}

      {/* Admin activate/archive — bottom right */}
      {role === 'super_admin' && (
        <AdminFloatingButton slug={slug} />
      )}
    </>
  )
}
