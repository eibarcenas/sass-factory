import { defineEventHandler, getQuery } from 'h3'
import { requireAuth } from '~/server/middleware/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const { days = '30' } = getQuery(event)
  const n = Math.min(Number(days), 90)

  // TODO Sprint 8: query Firestore clicks grouped by day
  const data = Array.from({ length: n }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (n - 1 - i))
    return {
      date: date.toISOString().slice(0, 10),
      visits: Math.floor(Math.random() * 60) + 10,
      clicks: Math.floor(Math.random() * 15) + 2,
    }
  })
  return { data }
})
