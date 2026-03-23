import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { useFirestore, useCollection } from 'vuefire'
import type { AppConfig } from '@sass-factory/core'
import { TOPIC_PRESETS, COLLECTIONS } from '@sass-factory/core'

// ---------------------------------------------------------------------------
// Mock data — used when FIREBASE_API_KEY is not set
// ---------------------------------------------------------------------------
const MOCK_APPS: AppConfig[] = Object.entries(TOPIC_PRESETS).map(([key, preset], i) => ({
  id: `mock_${key}`,
  topic: key,
  name: preset.name,
  slug: key,
  status: i === 0 ? 'active' : 'draft',
  theme: {
    primary: preset.primary ?? '#6366f1',
    secondary: preset.secondary ?? '#a5b4fc',
    accent: preset.accent ?? '#f59e0b',
    background: preset.background ?? '#ffffff',
    font: preset.font ?? 'Inter',
    emoji: preset.emoji ?? '✨',
    gradient: preset.gradient ?? ['#6366f1', '#8b5cf6'],
  },
  features: ['hero', 'gallery', 'closing'],
  metadata: { title: preset.name, description: `${preset.emoji} Themed experience for ${preset.name}` },
  createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
  updatedAt: new Date().toISOString(),
}))

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------
export function useApps() {
  const config = useRuntimeConfig()

  // ── Mock mode (no Firebase config) ──────────────────────────────────────
  if (config.public.mockMode) {
    const apps = useState<AppConfig[]>('mock:apps', () => [...MOCK_APPS])

    async function createApp(data: Omit<AppConfig, 'id' | 'createdAt' | 'updatedAt'>) {
      const id = `mock_${Date.now()}`
      const now = new Date().toISOString()
      apps.value = [...apps.value, { ...data, id, createdAt: now, updatedAt: now }]
      return { id }
    }

    async function updateApp(id: string, data: Partial<AppConfig>) {
      apps.value = apps.value.map((a) =>
        a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a,
      )
    }

    async function deleteApp(id: string) {
      apps.value = apps.value.filter((a) => a.id !== id)
    }

    return { apps, createApp, updateApp, deleteApp }
  }

  // ── Firebase mode ────────────────────────────────────────────────────────
  const db = useFirestore()
  const appsRef = collection(db, COLLECTIONS.APPS)
  const apps = useCollection<AppConfig>(appsRef)

  async function createApp(data: Omit<AppConfig, 'id' | 'createdAt' | 'updatedAt'>) {
    return addDoc(appsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async function updateApp(id: string, data: Partial<AppConfig>) {
    return updateDoc(doc(appsRef, id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteApp(id: string) {
    return deleteDoc(doc(appsRef, id))
  }

  return { apps, createApp, updateApp, deleteApp }
}
