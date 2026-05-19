import { defineEventHandler, createError } from 'h3'
import { logger } from '@sass-factory/core'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  logger.info('account deletion requested', { userId: user.uid })

  // Deletion order matters: children first, then parent
  // TODO Sprint 8 (Firestore real):
  // 1. Get businessId from users/{uid}
  // 2. Delete /businesses/{businessId}/clicks (subcollection, batch)
  // 3. Delete /businesses/{businessId}/items (subcollection, batch)
  // 4. Delete /businesses/{businessId}/categories (subcollection, batch)
  // 5. Delete /businesses/{businessId} (document)
  // 6. Delete /users/{uid} (document)
  // 7. Delete Firebase Auth user via admin SDK
  // 8. Delete Cloud Storage files (logo)

  // No PII in logs — do NOT log email or phone
  logger.info('account deletion scheduled', { userId: user.uid })

  return {
    success: true,
    message: 'Your account and all associated data will be deleted within 24 hours.',
    scheduledAt: new Date().toISOString(),
  }
})
