import type { UserCredential } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

function requireFirebaseConfig() {
  const { apiKey, authDomain, projectId } = firebaseConfig
  const hasPlaceholder = apiKey?.startsWith('REPLACE')

  if (!apiKey || !authDomain || !projectId || hasPlaceholder) {
    throw new Error(
      'Firebase Auth is not configured. Set the ei-catalog-dev web app values in apps/landing-fe/.env.local.',
    )
  }

  return { apiKey, authDomain, projectId }
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// Real Safari has "Version/X.X" in its UA. In-app browsers (WhatsApp, Instagram, etc.) don't.
function isRealSafari(): boolean {
  const ua = navigator.userAgent
  return /Version\/\d/.test(ua) && /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua)
}

// Load firebase/app and firebase/auth together so initializeApp(), getAuth() and the
// sign-in/redirect calls share one SDK module instance — mixing this with a static
// import elsewhere produced a second instance with an empty app registry,
// surfacing as "No Firebase App '[DEFAULT]' has been created" after the popup closed.
async function getFirebaseAuth() {
  const [{ getApp, getApps, initializeApp }, { getAuth }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ])
  const app = getApps().length ? getApp() : initializeApp(requireFirebaseConfig())
  return getAuth(app)
}

// Returns the signed-in credential, or null if the browser was redirected away
// to complete sign-in (the page navigates and getGoogleRedirectResult() picks
// up the result on return).
export async function signInWithGoogle(): Promise<UserCredential | null> {
  const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('firebase/auth')
  const auth = await getFirebaseAuth()
  const provider = new GoogleAuthProvider()

  try {
    return await signInWithPopup(auth, provider)
  } catch (err: any) {
    if (err.code === 'auth/popup-blocked') {
      if (isIOS() && !isRealSafari()) {
        // In-app browser (WhatsApp, Instagram, etc.) — redirect won't persist state either.
        throw new Error('Para iniciar sesión, abre esta página en Safari.')
      }
      // Real Safari, Desktop, or Android with popup blocked → fall back to redirect
      await signInWithRedirect(auth, provider)
      return null
    }
    throw err
  }
}

let redirectResultPromise: Promise<UserCredential | null> | null = null
let redirectResultClaimed = false

// On mount, recovers the credential from a signInWithRedirect() round trip.
// Multiple GoogleSignInButton instances may call this on the same page; only
// the first caller receives the credential, the rest get null.
export async function getGoogleRedirectResult(): Promise<UserCredential | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = (async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth')
        const auth = await getFirebaseAuth()
        return await getRedirectResult(auth)
      } catch {
        return null
      }
    })()
  }

  const result = await redirectResultPromise
  if (!result || redirectResultClaimed) return null
  redirectResultClaimed = true
  return result
}
