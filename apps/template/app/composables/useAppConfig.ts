import type { AppConfig } from '@sass-factory/core'
import { COLLECTIONS } from '@sass-factory/core'

export function useAppConfig() {
  const config = useRuntimeConfig()
  const appConfig = ref<AppConfig | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // ── Mock mode: read from template's own server API ─────────────────────
  // The API reads .dev-configs/{slug}.json written by admin/CLI at launch time.
  // No env var bloat — only APP_SLUG is needed.
  if (config.public.mockMode) {
    const { data, error: fetchError, pending } = useFetch<AppConfig>('/api/app-config', {
      // SSR-safe: fetches on server during hydration, cached on client
      key: `app-config-${config.public.appSlug}`,
    })

    watchEffect(() => {
      appConfig.value = data.value ?? null
      error.value = fetchError.value?.message ?? null
      isLoading.value = pending.value
    })

    return {
      appConfig,
      isLoading,
      error,
      loadBySlug: async () => {},
      loadById: async () => {},
      loadByDomain: async () => {},
    }
  }

  // ── Firebase mode ──────────────────────────────────────────────────────
  async function loadBySlug(slug: string) {
    isLoading.value = true
    error.value = null
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const { useFirestore } = await import('vuefire')
      const db = useFirestore()
      const snap = await getDocs(query(collection(db, COLLECTIONS.APPS), where('slug', '==', slug)))
      if (!snap.empty) {
        const d = snap.docs[0]
        appConfig.value = { id: d.id, ...d.data() } as AppConfig
      } else {
        error.value = 'App not found'
      }
    } catch (e: any) {
      error.value = e.message ?? 'Failed to load config'
    } finally {
      isLoading.value = false
    }
  }

  async function loadById(id: string) {
    isLoading.value = true
    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const { useFirestore } = await import('vuefire')
      const db = useFirestore()
      const snap = await getDoc(doc(db, COLLECTIONS.APPS, id))
      if (snap.exists()) appConfig.value = { id: snap.id, ...snap.data() } as AppConfig
      else error.value = 'App not found'
    } catch (e: any) {
      error.value = e.message ?? 'Failed to load config'
    } finally {
      isLoading.value = false
    }
  }

  async function loadByDomain(domain: string) {
    isLoading.value = true
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const { useFirestore } = await import('vuefire')
      const db = useFirestore()
      const snap = await getDocs(query(collection(db, COLLECTIONS.APPS), where('domain', '==', domain)))
      if (!snap.empty) {
        const d = snap.docs[0]
        appConfig.value = { id: d.id, ...d.data() } as AppConfig
      } else if (config.public.appSlug) {
        await loadBySlug(config.public.appSlug as string)
      } else {
        error.value = 'App not found'
      }
    } catch (e: any) {
      error.value = e.message ?? 'Failed to load config'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(async () => {
    const domain = config.public.appDomain as string
    const slug = config.public.appSlug as string
    if (domain) await loadByDomain(domain)
    else if (slug) await loadBySlug(slug)
    else isLoading.value = false
  })

  return { appConfig, isLoading, error, loadBySlug, loadById, loadByDomain }
}
