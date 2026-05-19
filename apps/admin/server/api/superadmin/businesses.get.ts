import { defineEventHandler, getQuery } from 'h3'
import { requireAuth } from '~/server/middleware/auth'
import type { Business } from '@sass-factory/core'

const ALL_BUSINESSES: Business[] = [
  { id: 'heladeria-pinguino', slug: 'heladeria-pinguino', name: 'Heladería El Pingüino', type: 'heladeria', whatsapp: '+521234567890', city: 'Monterrey', tagline: 'La mejor heladería artesanal', theme: { primary: '#06b6d4', secondary: '#cffafe', accent: '#f59e0b', background: '#f0fdfe', font: 'Quicksand', emoji: '🍦', gradient: ['#06b6d4', '#0891b2'] }, status: 'active', plan: 'pro', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' },
  { id: 'barber-king', slug: 'barber-king', name: 'Barber King', type: 'barberia', whatsapp: '+529876543210', city: 'CDMX', tagline: 'El mejor corte', theme: { primary: '#1f2937', secondary: '#6b7280', accent: '#f59e0b', background: '#f9fafb', font: 'Oswald', emoji: '💈', gradient: ['#1f2937', '#374151'] }, status: 'sent', plan: 'free', createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z' },
  { id: 'studio-glow', slug: 'studio-glow', name: 'Studio Glow', type: 'estetica', whatsapp: '+521112223333', city: 'Guadalajara', tagline: 'Tu belleza, nuestra pasión', theme: { primary: '#db2777', secondary: '#fbcfe8', accent: '#f59e0b', background: '#fdf2f8', font: 'Cormorant Garamond', emoji: '💅', gradient: ['#db2777', '#ec4899'] }, status: 'active', plan: 'free', createdAt: '2026-02-10T11:00:00Z', updatedAt: '2026-02-10T11:00:00Z' },
  { id: 'pan-dulce', slug: 'pan-dulce', name: 'Panadería Pan Dulce', type: 'panaderia', whatsapp: '+524443332211', city: 'Puebla', tagline: 'El sabor de siempre', theme: { primary: '#b45309', secondary: '#fde68a', accent: '#f97316', background: '#fffbeb', font: 'Pacifico', emoji: '🥐', gradient: ['#b45309', '#d97706'] }, status: 'demo', plan: 'free', createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
  { id: 'fit-zone', slug: 'fit-zone', name: 'FitZone Gym', type: 'gym', whatsapp: '+525551234567', city: 'Monterrey', tagline: 'Tu mejor versión', theme: { primary: '#1d4ed8', secondary: '#bfdbfe', accent: '#22c55e', background: '#eff6ff', font: 'Bebas Neue', emoji: '💪', gradient: ['#1d4ed8', '#1e40af'] }, status: 'suspended', plan: 'pro', createdAt: '2026-01-20T14:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
]

export default defineEventHandler(async (event) => {
  await requireAuth(event, { requiredRole: 'superadmin' })
  const { status, type, page = '1', limit = '20', q } = getQuery(event)

  let results = [...ALL_BUSINESSES]
  if (status) results = results.filter((b) => b.status === status)
  if (type) results = results.filter((b) => b.type === type)
  if (q) results = results.filter((b) => b.name.toLowerCase().includes(String(q).toLowerCase()))

  return { businesses: results, total: results.length, page: Number(page), limit: Number(limit) }
})
