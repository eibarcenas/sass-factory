import { useEffect, useRef, useState } from 'react'
import type { UserCredential } from 'firebase/auth'

const FIREBASE_CONFIG = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
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

  // On mount: pick up any pending redirect result from signInWithRedirect
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth')
        const auth = await initFirebase()
        const result = await getRedirectResult(auth)
        if (!cancelled && result) {
          setPending(true)
          await onCredentialRef.current(result)
        }
      } catch {
        // nothing to do — redirect result errors are non-actionable on mount
      } finally {
        if (!cancelled) {
          setPending(false)
          setRedirectChecked(true)
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

      if (isMobileDevice()) {
        const { signInWithRedirect } = await import('firebase/auth')
        await signInWithRedirect(auth, provider)
        // Page navigates away; code below won't run
        return
      }

      const { signInWithPopup } = await import('firebase/auth')
      try {
        const cred = await signInWithPopup(auth, provider)
        await onCredentialRef.current(cred)
      } catch (err: any) {
        if (err.code === 'auth/popup-blocked') {
          // Fall back to redirect when popup is blocked
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
