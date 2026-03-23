/**
 * Firestore seed script.
 * Run: npx ts-node infrastructure/firestore/seed.ts
 *
 * Requires a service account key at: infrastructure/firestore/service-account.json
 * (Do NOT commit the service account JSON to git)
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { TOPIC_PRESETS } from '../../packages/core/src/types/app'
import type { AppConfig } from '../../packages/core/src/types/app'

const serviceAccount = require('./service-account.json')

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

const seedApps: Omit<AppConfig, 'id'>[] = [
  {
    topic: 'love',
    name: "Happy Valentine's Day",
    slug: 'valentines-2024',
    status: 'active',
    theme: {
      ...TOPIC_PRESETS.love,
      emoji: TOPIC_PRESETS.love.emoji,
      font: TOPIC_PRESETS.love.font!,
      gradient: TOPIC_PRESETS.love.gradient!,
      primary: TOPIC_PRESETS.love.primary!,
      secondary: TOPIC_PRESETS.love.secondary!,
      accent: TOPIC_PRESETS.love.accent!,
      background: TOPIC_PRESETS.love.background!,
    },
    features: ['hero', 'timeline', 'gallery', 'letter', 'moments', 'closing'],
    metadata: {
      title: "Happy Valentine's Day, My Love",
      description: 'A special day celebrating our love.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    topic: 'reyes',
    name: 'Reyes Magos 2024',
    slug: 'reyes-2024',
    status: 'active',
    theme: {
      ...TOPIC_PRESETS.reyes,
      emoji: TOPIC_PRESETS.reyes.emoji,
      font: TOPIC_PRESETS.reyes.font!,
      gradient: TOPIC_PRESETS.reyes.gradient!,
      primary: TOPIC_PRESETS.reyes.primary!,
      secondary: TOPIC_PRESETS.reyes.secondary!,
      accent: TOPIC_PRESETS.reyes.accent!,
      background: TOPIC_PRESETS.reyes.background!,
    },
    features: ['hero', 'gallery', 'countdown', 'closing'],
    metadata: {
      title: 'Noche de Reyes Magos',
      description: 'Celebrando la llegada de los Reyes Magos.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    topic: 'mom',
    name: "Mother's Day",
    slug: 'mothers-day-2024',
    status: 'draft',
    theme: {
      ...TOPIC_PRESETS.mom,
      emoji: TOPIC_PRESETS.mom.emoji,
      font: TOPIC_PRESETS.mom.font!,
      gradient: TOPIC_PRESETS.mom.gradient!,
      primary: TOPIC_PRESETS.mom.primary!,
      secondary: TOPIC_PRESETS.mom.secondary!,
      accent: TOPIC_PRESETS.mom.accent!,
      background: TOPIC_PRESETS.mom.background!,
    },
    features: ['hero', 'timeline', 'gallery', 'letter', 'feed', 'closing'],
    metadata: {
      title: 'Happy Mother\'s Day',
      description: 'For the most amazing mom in the world.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    topic: 'dad',
    name: "Father's Day",
    slug: 'fathers-day-2024',
    status: 'draft',
    theme: {
      ...TOPIC_PRESETS.dad,
      emoji: TOPIC_PRESETS.dad.emoji,
      font: TOPIC_PRESETS.dad.font!,
      gradient: TOPIC_PRESETS.dad.gradient!,
      primary: TOPIC_PRESETS.dad.primary!,
      secondary: TOPIC_PRESETS.dad.secondary!,
      accent: TOPIC_PRESETS.dad.accent!,
      background: TOPIC_PRESETS.dad.background!,
    },
    features: ['hero', 'timeline', 'letter', 'closing'],
    metadata: {
      title: "Happy Father's Day, Dad",
      description: 'For the best dad in the world.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

async function seed() {
  console.log('🌱 Seeding Firestore with initial app configs...\n')

  for (const appData of seedApps) {
    try {
      const docRef = await db.collection('apps').add({
        ...appData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      console.log(`✅ Created app: ${appData.name} (ID: ${docRef.id})`)
    } catch (error) {
      console.error(`❌ Failed to create ${appData.name}:`, error)
    }
  }

  console.log('\n✨ Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
