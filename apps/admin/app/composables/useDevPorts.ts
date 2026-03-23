interface DevEntry {
  port: number
  pid?: number
  startedAt: number
}

export function useDevPorts() {
  const ports = ref<Record<string, DevEntry>>({})
  const launching = ref<Set<string>>(new Set())

  async function refresh() {
    try {
      ports.value = await $fetch<Record<string, DevEntry>>('/api/dev/ports')
    } catch {}
  }

  async function launchApp(slug: string, appConfig?: unknown) {
    launching.value = new Set([...launching.value, slug])
    try {
      const result = await $fetch<{ port: number; url: string; isNew: boolean }>('/api/dev/launch', {
        method: 'POST',
        body: { slug, appConfig },
      })
      await refresh()
      return result
    } finally {
      launching.value = new Set([...launching.value].filter((s) => s !== slug))
    }
  }

  async function stopApp(slug: string) {
    try {
      await $fetch('/api/dev/stop', { method: 'POST', body: { slug } })
      await refresh()
    } catch {}
  }

  function getDevUrl(slug: string): string | null {
    const entry = ports.value[slug]
    return entry ? `http://localhost:${entry.port}` : null
  }

  function isLaunching(slug: string) {
    return launching.value.has(slug)
  }

  function isRunning(slug: string) {
    return !!ports.value[slug]
  }

  // Poll every 5s to keep status fresh
  onMounted(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    onUnmounted(() => clearInterval(interval))
  })

  return { ports, launching, refresh, launchApp, stopApp, getDevUrl, isLaunching, isRunning }
}
