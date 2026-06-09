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

export async function signInWithGoogle() {
  // Load firebase/app and firebase/auth together so initializeApp(), getAuth() and
  // signInWithPopup() share one SDK module instance — mixing this with a static
  // import elsewhere produced a second instance with an empty app registry,
  // surfacing as "No Firebase App '[DEFAULT]' has been created" after the popup closed.
  const [{ getApp, getApps, initializeApp }, { getAuth, signInWithPopup, GoogleAuthProvider }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ])

  const app = getApps().length ? getApp() : initializeApp(requireFirebaseConfig())
  const auth = getAuth(app)
  return signInWithPopup(auth, new GoogleAuthProvider())
}
