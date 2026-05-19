export type NotificationType = 'app_created' | 'app_deployed' | 'app_simulated' | 'info' | 'error'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  link?: string        // e.g. /apps/mock_love
  createdAt: number
  read: boolean
}

// In-memory ring buffer — last 50 notifications
const MAX = 50
const store: AppNotification[] = []

// Active SSE subscribers
type Subscriber = (n: AppNotification) => void
const subscribers = new Set<Subscriber>()

export function pushNotification(
  data: Pick<AppNotification, 'type' | 'title' | 'message' | 'link'>,
): AppNotification {
  const n: AppNotification = {
    ...data,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    read: false,
  }
  store.unshift(n)
  if (store.length > MAX) store.pop()
  subscribers.forEach((fn) => fn(n))
  return n
}

export function getNotifications(): AppNotification[] {
  return store
}

export function subscribeNotifications(fn: Subscriber): () => void {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function markRead(id: string) {
  const n = store.find((x) => x.id === id)
  if (n) n.read = true
}

export function markAllRead() {
  store.forEach((n) => { n.read = true })
}
