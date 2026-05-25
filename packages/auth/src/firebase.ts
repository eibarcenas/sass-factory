import { useEffect, useState } from 'react'
import type { AuthUser, AuthStore } from './types'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
}

export interface FirebaseAuthRestoreOptions {
  store: {
    mockMode: boolean
    setUser: AuthStore['setUser']
  }
  firebaseConfig: FirebaseConfig | null
  buildUser: (uid: string, email: string | null, claims: Record<string, unknown>) => AuthUser | null
}

export function useFirebaseAuthRestore({ store, firebaseConfig, buildUser }: FirebaseAuthRestoreOptions): { checking: boolean } {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (store.mockMode || !firebaseConfig) {
      setChecking(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    async function init() {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth')
        const { initializeApp, getApps } = await import('firebase/app')

        if (!getApps().length) {
          initializeApp(firebaseConfig!)
        }

        const auth = getAuth()
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            const { claims } = await fbUser.getIdTokenResult()
            const user = buildUser(fbUser.uid, fbUser.email, claims)
            store.setUser(user)
          } else {
            store.setUser(null)
          }
          setChecking(false)
        })
      } catch {
        setChecking(false)
      }
    }

    init()
    return () => { unsubscribe?.() }
  }, [store.mockMode]) // eslint-disable-line react-hooks/exhaustive-deps

  return { checking }
}
