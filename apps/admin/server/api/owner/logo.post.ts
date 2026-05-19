import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { requireAuth } from '~/server/middleware/auth'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const formData = await readMultipartFormData(event)
  const file = formData?.find((f) => f.name === 'logo')

  if (!file) throw createError({ statusCode: 400, message: 'No logo file uploaded' })
  if (!ALLOWED_MIME.includes(file.type ?? '')) {
    throw createError({ statusCode: 400, message: `Invalid file type. Allowed: JPEG, PNG, WebP` })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, message: `File too large. Max 2MB` })
  }
  // TODO Sprint 8: upload to Cloud Storage
  return { logoUrl: `https://storage.googleapis.com/sass-factory/logos/mock-${Date.now()}.jpg` }
})
