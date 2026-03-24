import { createEventStream } from 'h3'
import { subscribeNotifications, getNotifications } from '../../utils/notification-store'

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  // Send existing notifications on connect so the client can hydrate
  const existing = getNotifications()
  if (existing.length) {
    await eventStream.push(JSON.stringify(existing), 'init')
  }

  // Subscribe to new notifications
  const unsubscribe = subscribeNotifications(async (n) => {
    await eventStream.push(JSON.stringify(n), 'notification')
  })

  eventStream.onClosed(() => {
    unsubscribe()
  })

  return eventStream.send()
})
