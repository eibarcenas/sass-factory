import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { useFirestore, useCollection } from 'vuefire'
import type { Business } from '@sass-factory/core'
import { COLLECTIONS } from '@sass-factory/core'

// ---------------------------------------------------------------------------
// Mock data — used when FIREBASE_API_KEY is not set
// ---------------------------------------------------------------------------
const MOCK_APPS: Business[] = [
  {
    id: 'mock_heladeria',
    slug: 'heladeria-demo',
    name: 'Heladería El Pingüino',
    type: 'heladeria',
    whatsapp: '+52 81 0000 0001',
    city: 'Monterrey',
    tagline: 'El mejor helado de la ciudad',
    theme: { primary: '#06b6d4', secondary: '#a5f3fc', accent: '#f59e0b', background: '#ffffff', font: 'Poppins', emoji: '🍦', gradient: ['#06b6d4', '#0ea5e9'] },
    status: 'active',
    plan: 'free',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock_barberia',
    slug: 'barberia-demo',
    name: 'Barbería El Cortex',
    type: 'barberia',
    whatsapp: '+52 81 0000 0002',
    city: 'Monterrey',
    tagline: 'Cortes de alta precisión',
    theme: { primary: '#1e293b', secondary: '#334155', accent: '#f59e0b', background: '#f8fafc', font: 'Inter', emoji: '✂️', gradient: ['#1e293b', '#334155'] },
    status: 'draft',
    plan: 'free',
    createdAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock_restaurante',
    slug: 'restaurante-demo',
    name: 'Restaurante La Familia',
    type: 'restaurante',
    whatsapp: '+52 81 0000 0003',
    city: 'Guadalajara',
    tagline: 'Sabores de casa',
    theme: { primary: '#b45309', secondary: '#fef3c7', accent: '#dc2626', background: '#fffbeb', font: 'Merriweather', emoji: '🍽️', gradient: ['#b45309', '#d97706'] },
    status: 'draft',
    plan: 'free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------
export function useApps() {
  const config = useRuntimeConfig()

  // ── Mock mode (no Firebase config) ──────────────────────────────────────
  if (config.public.mockMode) {
    const apps = useState<Business[]>('mock:apps', () => [...MOCK_APPS])

    async function createApp(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) {
      const id = `mock_${Date.now()}`
      const now = new Date().toISOString()
      apps.value = [...apps.value, { ...data, id, createdAt: now, updatedAt: now }]
      return { id }
    }

    async function updateApp(id: string, data: Partial<Business>) {
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
  const apps = useCollection<Business>(appsRef)

  async function createApp(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) {
    return addDoc(appsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async function updateApp(id: string, data: Partial<Business>) {
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
