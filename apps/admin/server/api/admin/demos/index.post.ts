import { defineEventHandler, readBody, createError } from 'h3'
import { requireAuth } from '~~/server/middleware/auth'
import { initAdmin } from '~~/server/utils/firebase-admin'
import { logger } from '@sass-factory/core'
import type { Business } from '@sass-factory/core'

export default defineEventHandler(async (event) => {
  await requireAuth(event, { requiredRole: 'admin' })

  const body = await readBody(event)
  const { name, type, whatsapp, city, tagline, theme } = body ?? {}

  if (!name?.trim()) throw createError({ statusCode: 400, message: 'name is required' })
  if (!type) throw createError({ statusCode: 400, message: 'type is required' })
  if (!whatsapp?.trim()) throw createError({ statusCode: 400, message: 'whatsapp is required' })
  if (!city?.trim()) throw createError({ statusCode: 400, message: 'city is required' })

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)

  const now = new Date().toISOString()

  const business: Business & { items: [] } = {
    id: slug,
    slug,
    name: name.trim(),
    type,
    whatsapp: whatsapp.trim(),
    city: city.trim(),
    tagline: tagline?.trim() || undefined,
    theme: theme ?? {
      primary: '#6366f1',
      secondary: '#a5b4fc',
      accent: '#f59e0b',
      background: '#ffffff',
      font: 'Inter',
      emoji: '🏪',
      gradient: ['#6366f1', '#8b5cf6'],
    },
    status: 'demo',
    plan: 'free',
    createdAt: now,
    updatedAt: now,
    items: [],
  }

  // Persist to Firestore demos/{slug}
  try {
    initAdmin()
    const { getFirestore } = await import('firebase-admin/firestore')
    await getFirestore().collection('demos').doc(slug).set(business)
    logger.info('demo created manually', { slug })
  } catch (err: any) {
    logger.warn('Firestore write failed', { error: err.message })
  }

  return business
})
