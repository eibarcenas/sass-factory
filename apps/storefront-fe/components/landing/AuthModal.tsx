'use client'

import { useState } from 'react'

const API_URL   = process.env.NEXT_PUBLIC_IDENTITY_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:5173'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  if (!open) return null

  async function handleGoogle() {
    setLoading(true)
    setError('')
    try {
      const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
      const { initializeApp, getApps } = await import('firebase/app')

      if (!getApps().length) {
        initializeApp({
          apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
          projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        })
      }

      const auth     = getAuth()
      const provider = new GoogleAuthProvider()
      const cred     = await signInWithPopup(auth, provider)
      const token    = await cred.user.getIdToken(true)

      // Provision / resolve claims on the API
      await fetch(`${API_URL}/api/v1/auth/resolve-claims`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null)

      window.location.href = ADMIN_URL
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false)
        return
      }
      setError('Algo salio mal. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100]"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crea tu cuenta o inicia sesion"
        className="fixed inset-0 z-[101] flex items-center justify-center px-4"
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6"
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-extrabold text-lg tracking-tight">catalog.mx</span>
              <button
                onClick={onClose}
                className="text-[#888888] hover:text-white transition-colors text-xl leading-none"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
            <p className="text-[#888888] text-sm">
              Crea tu cuenta o inicia sesion con Google. Sin contrasenas.
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg
                       font-semibold text-sm transition-all duration-150
                       active:scale-[0.98] disabled:opacity-60"
            style={{
              background: loading ? 'rgba(255,255,255,0.06)' : 'white',
              color: '#111',
            }}
          >
            {!loading && (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Ingresando...' : 'Continuar con Google'}
          </button>

          {error && (
            <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>
          )}

          {/* Legal note */}
          <p className="text-[11px] text-center leading-relaxed" style={{ color: '#555' }}>
            Al continuar aceptas los{' '}
            <a href="/terminos" className="underline underline-offset-2" style={{ color: '#777' }}>
              Terminos y Condiciones
            </a>{' '}
            y la{' '}
            <a href="/privacidad" className="underline underline-offset-2" style={{ color: '#777' }}>
              Politica de Privacidad
            </a>{' '}
            de catalog.mx.
          </p>
        </div>
      </div>
    </>
  )
}
