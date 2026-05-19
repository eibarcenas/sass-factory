import { markRead, markAllRead } from '../../utils/notification-store'

export default defineEventHandler(async (event) => {
  const { id, all } = await readBody(event)
  if (all) {
    markAllRead()
  } else if (id) {
    markRead(id)
  }
  return { ok: true }
})
