'use client'

import { useState, useRef, useEffect } from 'react'
import {
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function AuthWall({ slug: _slug }: { slug: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'google' | 'phone'>('google')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'input' | 'otp'>('input')
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

  useEffect(() => {
    return () => { recaptchaRef.current?.clear() }
  }, [])

  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      window.location.reload()
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('No se pudo iniciar sesión. Intenta de nuevo.')
      }
      setLoading(false)
    }
  }

  async function handleSendOtp() {
    setLoading(true)
    setError('')
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
      }
      const digits = phone.replace(/\D/g, '')
      const phoneE164 = phone.startsWith('+') ? phone : `+52${digits}`
      confirmationRef.current = await signInWithPhoneNumber(auth, phoneE164, recaptchaRef.current)
      setStep('otp')
    } catch {
      setError('No se pudo enviar el código. Verifica el número.')
      recaptchaRef.current?.clear()
      recaptchaRef.current = null
    }
    setLoading(false)
  }

  async function handleVerifyOtp() {
    if (!confirmationRef.current) return
    setLoading(true)
    setError('')
    try {
      await confirmationRef.current.confirm(otp)
      window.location.reload()
    } catch {
      setError('Código incorrecto. Intenta de nuevo.')
    }
    setLoading(false)
  }

  function switchTab(t: 'google' | 'phone') {
    setTab(t)
    setError('')
    setStep('input')
    setOtp('')
  }

  const phoneDigits = phone.replace(/\D/g, '')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FAF9F6' }}>
      <div id="recaptcha-container" />

      <div className="text-center max-w-xs space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-zinc-900">Vista previa</p>
          <p className="text-sm text-zinc-500">
            Este catálogo está en revisión.<br />
            Inicia sesión para verlo.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 gap-0.5">
          <button
            onClick={() => switchTab('google')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === 'google' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Google
          </button>
          <button
            onClick={() => switchTab('phone')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === 'phone' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            WhatsApp
          </button>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {tab === 'google' && (
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
          </button>
        )}

        {tab === 'phone' && step === 'input' && (
          <div className="space-y-3">
            <div className="flex rounded-xl border border-zinc-200 overflow-hidden bg-white">
              <span className="px-3 py-2.5 text-sm text-zinc-500 bg-zinc-50 border-r border-zinc-200 whitespace-nowrap select-none">
                +52
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="55 1234 5678"
                className="flex-1 px-3 py-2.5 text-sm text-zinc-900 bg-white outline-none"
                maxLength={12}
                autoFocus
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading || phoneDigits.length < 10}
              className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium transition-colors hover:bg-zinc-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : 'Enviar código'}
            </button>
          </div>
        )}

        {tab === 'phone' && step === 'otp' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">Código enviado a +52 {phone}</p>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              className="w-full px-4 py-2.5 text-center text-xl tracking-[0.5em] rounded-xl border border-zinc-200 bg-white text-zinc-900 outline-none"
              autoFocus
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium transition-colors hover:bg-zinc-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : 'Verificar código'}
            </button>
            <button
              onClick={() => { setStep('input'); setOtp(''); setError('') }}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              ← Cambiar número
            </button>
          </div>
        )}

        <a href="https://catalog.mx" className="inline-block text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          catalog.mx
        </a>
      </div>
    </div>
  )
}
