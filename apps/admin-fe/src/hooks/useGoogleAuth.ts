import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserCredential } from 'firebase/auth'

const FIREBASE_CONFIG = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// Real Safari has "Version/X.X" in its UA. In-app browsers (WhatsApp, Instagram, etc.) don't.
function isRealSafari(): boolean {
  const ua = navigator.userAgent
  return /Version\/\d/.test(ua) && /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua)
}

async function initFirebase() {
  const { initializeApp, getApps } = await import('firebase/app')
  if (!getApps().length) initializeApp(FIREBASE_CONFIG)
  const { getAuth } = await import('firebase/auth')
  return getAuth()
}

async function doRedirect(auth: Awaited<ReturnType<typeof initFirebase>>) {
  const { GoogleAuthProvider, signInWithRedirect } = await import('firebase/auth')
  await signInWithRedirect(auth, new GoogleAuthProvider())
}

export function useGoogleAuth(onCredential: (cred: UserCredential) => Promise<void>) {
  const [pending, setPending] = useState(false)
  const [redirectChecked, setRedirectChecked] = useState(false)
  const onCredentialRef = useRef(onCredential)
  onCredentialRef.current = onCredential

  // On mount: pick up any pending redirect result (redirect flow return)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let result = null
      try {
        const { getRedirectResult } = await import('firebase/auth')
        const auth = await initFirebase()
        result = await getRedirectResult(auth)
      } catch {
        // No valid redirect state — treat as null
      }

      if (!cancelled) {
        if (result) {
          // Set pending and redirectChecked together so consumers never see
          // redirectChecked=true with pending=false while processing a redirect return.
          // React 18 batches these two synchronous setState calls into one render.
          setPending(true)
          setRedirectChecked(true)
          try {
            await onCredentialRef.current(result)
          } catch (err: any) {
            // Surface credential errors — these are actionable
            onCredentialRef.current = async () => { throw err }
          } finally {
            if (!cancelled) setPending(false)
          }
        } else {
          setRedirectChecked(true)
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setPending(true)
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
      const auth = await initFirebase()
      const provider = new GoogleAuthProvider()

      // Try popup on all platforms first. Chrome blocks third-party cookies since 2024,
      // which breaks signInWithRedirect when authDomain differs from the app domain.
      // Popup avoids this; redirect is only the fallback when popups are explicitly blocked.
      try {
        const cred = await signInWithPopup(auth, provider)
        await onCredentialRef.current(cred)
      } catch (err: any) {
        if (err.code === 'auth/popup-blocked') {
          if (isIOS() && !isRealSafari()) {
            // In-app browser (WhatsApp, Instagram, etc.) — redirect won't persist state either.
            // Tell the user to open in a real browser.
            throw new Error('Para iniciar sesión, abre esta página en Safari.')
          }
          // Real Safari, Desktop, or Android with popup blocked → fall back to redirect
          await doRedirect(auth)
          return
        }
        if (err.code === 'auth/popup-closed-by-user') return
        throw err
      }
    } finally {
      setPending(false)
    }
  }, [])

  return { signInWithGoogle, pending, redirectChecked }
}
