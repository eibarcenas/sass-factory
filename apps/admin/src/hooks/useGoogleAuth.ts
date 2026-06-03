import { useEffect, useRef, useState } from 'react'
import type { UserCredential } from 'firebase/auth'

const FIREBASE_CONFIG = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent)
}

async function initFirebase() {
  const { initializeApp, getApps } = await import('firebase/app')
  if (!getApps().length) initializeApp(FIREBASE_CONFIG)
  const { getAuth } = await import('firebase/auth')
  return getAuth()
}

export function useGoogleAuth(onCredential: (cred: UserCredential) => Promise<void>) {
  const [pending, setPending] = useState(false)
  const [redirectChecked, setRedirectChecked] = useState(false)
  const onCredentialRef = useRef(onCredential)
  onCredentialRef.current = onCredential

  // On mount: pick up any pending redirect result (Android redirect flow)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let result = null
      try {
        const { getRedirectResult } = await import('firebase/auth')
        const auth = await initFirebase()
        result = await getRedirectResult(auth)
      } catch {
        // getRedirectResult errors mean no valid redirect — treat as null
      } finally {
        if (!cancelled) setRedirectChecked(true)
      }

      if (result && !cancelled) {
        setPending(true)
        try {
          await onCredentialRef.current(result)
        } catch (err: any) {
          // Surface credential errors — these are actionable
          onCredentialRef.current = async () => { throw err }
        } finally {
          if (!cancelled) setPending(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function signInWithGoogle() {
    setPending(true)
    try {
      const { GoogleAuthProvider } = await import('firebase/auth')
      const auth = await initFirebase()
      const provider = new GoogleAuthProvider()

      if (isAndroid()) {
        // Android: redirect works reliably
        const { signInWithRedirect } = await import('firebase/auth')
        await signInWithRedirect(auth, provider)
        return // page navigates away
      }

      // iOS or Desktop: use popup (user gesture makes it allowed in real browsers)
      const { signInWithPopup } = await import('firebase/auth')
      try {
        const cred = await signInWithPopup(auth, provider)
        await onCredentialRef.current(cred)
      } catch (err: any) {
        if (err.code === 'auth/popup-blocked') {
          if (isIOS()) {
            // In-app browser (WhatsApp, etc.) blocks popups and redirect doesn't persist state.
            // Tell the user to open in a real browser.
            throw new Error('Para iniciar sesión, abre esta página en Safari.')
          }
          // Desktop: fall back to redirect
          const { signInWithRedirect } = await import('firebase/auth')
          await signInWithRedirect(auth, provider)
          return
        }
        if (err.code === 'auth/popup-closed-by-user') return
        throw err
      }
    } finally {
      setPending(false)
    }
  }

  return { signInWithGoogle, pending, redirectChecked }
}
