import { pushNotification } from '../../utils/notification-store'

export default defineEventHandler(async (event) => {
  const { type, title, message, link } = await readBody(event)

  if (!title?.trim()) {
    throw createError({ statusCode: 400, message: 'title is required' })
  }

  const n = pushNotification({
    type: type ?? 'info',
    title: title.trim(),
    message: message?.trim() ?? '',
    link,
  })

  return n
})
