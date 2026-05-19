import { defineEventHandler, createError, getRouterParam } from 'h3'
import type { Business, Item } from '@sass-factory/core'

// Fallback mock for local dev without Firestore credentials
const MOCK_BUSINESSES: Record<string, Business & { items: Item[] }> = {
  'heladeria-pinguino': {
    id: 'heladeria-pinguino', slug: 'heladeria-pinguino',
    name: 'Heladería El Pingüino', type: 'heladeria',
    whatsapp: '+521234567890', city: 'Monterrey',
    tagline: 'La mejor heladería artesanal de Monterrey 🍦',
    theme: { primary: '#06b6d4', secondary: '#cffafe', accent: '#f59e0b', background: '#f0fdfe', font: 'Quicksand', emoji: '🍦', gradient: ['#06b6d4', '#0891b2'] },
    status: 'active', plan: 'free',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    items: [
      { id: 'item-1', businessId: 'heladeria-pinguino', name: 'Sundae de chocolate', price: 85, currency: 'MXN', description: 'Con 3 bolas de helado artesanal, crema batida y cereza', visible: true, order: 1, createdAt: '', updatedAt: '' },
      { id: 'item-2', businessId: 'heladeria-pinguino', name: 'Nieve de vainilla', price: 40, currency: 'MXN', description: 'Nieve artesanal', visible: true, order: 2, createdAt: '', updatedAt: '' },
      { id: 'item-3', businessId: 'heladeria-pinguino', name: 'Malteada de fresa', price: 65, currency: 'MXN', description: 'Malteada cremosa con fresas naturales', visible: true, order: 3, createdAt: '', updatedAt: '' },
    ],
  },
}

async function readFromFirestore(slug: string): Promise<(Business & { items: Item[] }) | null> {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) return null

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getFirestore } = await import('firebase-admin/firestore')

    if (!getApps().length) {
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      if (clientEmail && privateKey) {
        initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
      } else {
        initializeApp({ projectId })
      }
    }

    const db = getFirestore()

    // Check businesses collection first (activated businesses)
    const bizDoc = await db.collection('businesses').doc(slug).get()
    if (bizDoc.exists) {
      const data = bizDoc.data() as Business
      if (data.status === 'suspended') return null // handled as 410 below
      const itemsSnap = await db.collection('businesses').doc(slug).collection('items')
        .where('visible', '==', true).orderBy('order').get()
      const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Item)
      return { ...data, items }
    }

    // Check demos collection (AI-generated demos, not yet activated)
    const demoDoc = await db.collection('demos').doc(slug).get()
    if (demoDoc.exists) {
      const data = demoDoc.data() as Business & { items: Item[] }
      return data
    }

    return null
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug is required' })

  // Priority 1: Firestore (production + dev with credentials)
  const firestoreData = await readFromFirestore(slug)
  if (firestoreData) {
    if (firestoreData.status === 'suspended') {
      throw createError({ statusCode: 410, message: 'This business is currently suspended' })
    }
    return firestoreData
  }

  // Priority 2: local mock (dev without credentials)
  // TODO Sprint 10: remove this once Firestore is fully wired
  const business = MOCK_BUSINESSES[slug]
  if (!business) throw createError({ statusCode: 404, message: `Business '${slug}' not found` })
  if (business.status === 'suspended') throw createError({ statusCode: 410 })

  return business
})
