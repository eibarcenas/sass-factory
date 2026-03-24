export interface AppNotification {
  id: string
  type: 'app_created' | 'app_deployed' | 'app_simulated' | 'info' | 'error'
  title: string
  message: string
  link?: string
  createdAt: number
  read: boolean
}

export function useNotifications() {
  const notifications = useState<AppNotification[]>('notifications', () => [])
  const isOpen = ref(false)
  let es: EventSource | null = null

  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

  function connect() {
    if (es) return
    es = new EventSource('/api/notifications/stream')

    es.addEventListener('init', (e) => {
      try {
        const existing = JSON.parse(e.data) as AppNotification[]
        notifications.value = existing
      } catch {}
    })

    es.addEventListener('notification', (e) => {
      try {
        const n = JSON.parse(e.data) as AppNotification
        // Prepend, avoid duplicates
        if (!notifications.value.find((x) => x.id === n.id)) {
          notifications.value = [n, ...notifications.value]
        }
      } catch {}
    })

    es.onerror = () => {
      es?.close()
      es = null
      // Reconnect after 5s
      setTimeout(connect, 5000)
    }
  }

  function disconnect() {
    es?.close()
    es = null
  }

  async function emit(data: Pick<AppNotification, 'type' | 'title' | 'message' | 'link'>) {
    await $fetch('/api/notifications', { method: 'POST', body: data })
  }

  async function openAndMarkRead() {
    isOpen.value = true
    if (unreadCount.value > 0) {
      // Optimistic
      notifications.value = notifications.value.map((n) => ({ ...n, read: true }))
      await $fetch('/api/notifications/read', { method: 'POST', body: { all: true } }).catch(() => {})
    }
  }

  function close() {
    isOpen.value = false
  }

  function timeAgo(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  onMounted(connect)
  onUnmounted(disconnect)

  return {
    notifications,
    unreadCount,
    isOpen,
    emit,
    openAndMarkRead,
    close,
    timeAgo,
  }
}
