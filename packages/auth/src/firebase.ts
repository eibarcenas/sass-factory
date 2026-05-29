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
  buildUser: (uid: string, email: string | null, claims: Record<string, unknown>, displayName?: string | null, photoURL?: string | null) => AuthUser | null
  resolveClaimsUrl?: string
}

export function useFirebaseAuthRestore({ store, firebaseConfig, buildUser, resolveClaimsUrl }: FirebaseAuthRestoreOptions): { checking: boolean } {
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
            let tokenResult = await fbUser.getIdTokenResult()

            // No custom claims yet (no business_id) — try resolving pending_owners
            if (!tokenResult.claims.business_id && resolveClaimsUrl) {
              try {
                const res = await fetch(resolveClaimsUrl, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${tokenResult.token}` },
                })
                const json = await res.json()
                if (json.resolved) {
                  // Force-refresh so the new claims are in the next token
                  tokenResult = await fbUser.getIdTokenResult(true)
                }
              } catch {
                // Network error — proceed without claims, user stays on login
              }
            }

            const user = buildUser(fbUser.uid, fbUser.email, tokenResult.claims, fbUser.displayName, fbUser.photoURL)
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
