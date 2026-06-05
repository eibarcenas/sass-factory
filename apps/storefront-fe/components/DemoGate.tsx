'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import AuthWall from './AuthWall'
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
        if (r === 'SUPER_ADMIN') {
          setRole('super_admin')
        } else if (r === 'OWNER' && claims.business_id === slug) {
          setRole('owner')
        } else if (!r && user.phoneNumber) {
          // Phone-auth user: grant access if their number matches the business's registered WhatsApp
          const authDigits = user.phoneNumber.replace(/\D/g, '')
          const bizDigits = data.whatsapp.replace(/\D/g, '')
          setRole(authDigits.endsWith(bizDigits) ? 'owner' : 'other')
        } else {
          setRole('other')
        }
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

  return (
    <>
      <CatalogView data={data} isDemo />

      {/* Admin activate/archive — bottom right */}
      {role === 'super_admin' && (
        <AdminFloatingButton slug={slug} />
      )}
    </>
  )
}

