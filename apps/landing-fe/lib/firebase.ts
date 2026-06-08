import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

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

export async function getFirebaseAuth() {
  const app = getApps().length ? getApp() : initializeApp(requireFirebaseConfig())
  return getAuth(app)
}
