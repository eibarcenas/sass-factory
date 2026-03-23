import type { AppConfig } from '@sass-factory/core'
import { TOPIC_PRESETS, COLLECTIONS } from '@sass-factory/core'

// Build a full mock AppConfig from TOPIC_PRESETS for a given slug
function buildMockConfig(slug: string): AppConfig | null {
  const preset = TOPIC_PRESETS[slug]
  if (!preset) return null
  return {
    id: `mock_${slug}`,
    topic: slug,
    name: preset.name,
    slug,
    status: 'active',
    theme: {
      primary: preset.primary ?? '#6366f1',
      secondary: preset.secondary ?? '#a5b4fc',
      accent: preset.accent ?? '#f59e0b',
      background: preset.background ?? '#ffffff',
      font: preset.font ?? 'Inter',
      emoji: preset.emoji ?? '✨',
      gradient: preset.gradient ?? ['#6366f1', '#8b5cf6'],
    },
    features: ['hero', 'gallery', 'timeline', 'letter', 'closing'],
    metadata: {
      title: preset.name,
      description: `${preset.emoji} ${preset.name} themed experience`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function useAppConfig() {
  const config = useRuntimeConfig()
  const appConfig = ref<AppConfig | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // ── Mock mode (no Firebase) ────────────────────────────────────────────
  if (config.public.mockMode) {
    onMounted(() => {
      const slug = config.public.appSlug as string

      // 1. Try APP_MOCK_CONFIG injected by dev launcher
      if (config.public.mockConfig) {
        try {
          appConfig.value = JSON.parse(config.public.mockConfig as string)
          isLoading.value = false
          return
        } catch {}
      }

      // 2. Try TOPIC_PRESETS
      if (slug) {
        const mock = buildMockConfig(slug)
        if (mock) {
          appConfig.value = mock
          isLoading.value = false
          return
        }
      }

      error.value = slug ? `No preset found for slug "${slug}"` : 'APP_SLUG not set'
      isLoading.value = false
    })

    return { appConfig, isLoading, error, loadBySlug: async () => {}, loadById: async () => {}, loadByDomain: async () => {} }
  }

  // ── Firebase mode ──────────────────────────────────────────────────────
  const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore').catch(() => ({} as any))
  const { useFirestore } = await import('vuefire').catch(() => ({} as any))

  const db = useFirestore()

  async function loadBySlug(slug: string) {
    isLoading.value = true
    error.value = null
    try {
      const appsRef = collection(db, COLLECTIONS.APPS)
      const snap = await getDocs(query(appsRef, where('slug', '==', slug)))
      if (!snap.empty) {
        const d = snap.docs[0]
        appConfig.value = { id: d.id, ...d.data() } as AppConfig
      } else {
        error.value = 'App not found'
      }
    } catch (e) {
      error.value = 'Failed to load config'
    } finally {
      isLoading.value = false
    }
  }

  async function loadById(id: string) {
    isLoading.value = true
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.APPS, id))
      if (snap.exists()) appConfig.value = { id: snap.id, ...snap.data() } as AppConfig
      else error.value = 'App not found'
    } catch {
      error.value = 'Failed to load config'
    } finally {
      isLoading.value = false
    }
  }

  async function loadByDomain(domain: string) {
    isLoading.value = true
    try {
      const appsRef = collection(db, COLLECTIONS.APPS)
      const snap = await getDocs(query(appsRef, where('domain', '==', domain)))
      if (!snap.empty) {
        const d = snap.docs[0]
        appConfig.value = { id: d.id, ...d.data() } as AppConfig
      } else if (config.public.appSlug) {
        await loadBySlug(config.public.appSlug as string)
      } else {
        error.value = 'App not found'
      }
    } catch {
      error.value = 'Failed to load config'
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
