import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import type { AppConfig } from '@sass-factory/core'
import { COLLECTIONS } from '@sass-factory/core'

export function useAppConfig() {
  const db = useFirestore()
  const config = useRuntimeConfig()
  const appConfig = ref<AppConfig | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  async function loadBySlug(slug: string) {
    isLoading.value = true
    error.value = null
    try {
      const appsRef = collection(db, COLLECTIONS.APPS)
      const q = query(appsRef, where('slug', '==', slug))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const docSnap = snap.docs[0]
        appConfig.value = { id: docSnap.id, ...docSnap.data() } as AppConfig
      } else {
        error.value = 'App not found'
      }
    } catch (e) {
      error.value = 'Failed to load app configuration'
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  async function loadById(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const docRef = doc(db, COLLECTIONS.APPS, id)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        appConfig.value = { id: snap.id, ...snap.data() } as AppConfig
      } else {
        error.value = 'App not found'
      }
    } catch (e) {
      error.value = 'Failed to load app configuration'
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  async function loadByDomain(domain: string) {
    isLoading.value = true
    error.value = null
    try {
      const appsRef = collection(db, COLLECTIONS.APPS)
      const q = query(appsRef, where('domain', '==', domain))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const docSnap = snap.docs[0]
        appConfig.value = { id: docSnap.id, ...docSnap.data() } as AppConfig
      } else {
        // Fall back to slug-based lookup
        const slug = config.public.appSlug
        if (slug) await loadBySlug(slug)
        else error.value = 'App not found'
      }
    } catch (e) {
      error.value = 'Failed to load app configuration'
    } finally {
      isLoading.value = false
    }
  }

  // Auto-load on mount based on runtime config
  onMounted(async () => {
    const domain = config.public.appDomain
    const slug = config.public.appSlug
    if (domain) {
      await loadByDomain(domain)
    } else if (slug) {
      await loadBySlug(slug as string)
    } else {
      isLoading.value = false
    }
  })

  return { appConfig, isLoading, error, loadBySlug, loadById, loadByDomain }
}
