import { getApps, initializeApp, cert } from 'firebase-admin/app'

export function initAdmin() {
  if (getApps().length > 0) return

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    })
  } else if (projectId) {
    // Dev mode with emulator — no credentials needed
    initializeApp({ projectId })
  }
}
