import type { ProvisionJob } from '~/server/utils/job-store'

export function useProvision() {
  const job = ref<ProvisionJob | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  let es: EventSource | null = null

  async function startProvision(payload: {
    appId: string
    appName: string
    slug: string
    topic: string
    gcpProjectId: string
    region: string
    domain?: string
    firebaseProjectId?: string
  }) {
    error.value = null
    job.value = null

    const data = await $fetch('/api/infra/register', {
      method: 'POST',
      body: payload,
    })

    subscribeToJob((data as any).jobId)
    return (data as any).jobId
  }

  function subscribeToJob(jobId: string) {
    if (es) {
      es.close()
    }

    es = new EventSource(`/api/infra/${jobId}/stream`)
    isConnected.value = true

    es.addEventListener('update', (e) => {
      try {
        job.value = JSON.parse(e.data)
      } catch {}
    })

    es.addEventListener('done', (e) => {
      try {
        job.value = JSON.parse(e.data)
      } catch {}
      isConnected.value = false
      es?.close()
    })

    es.addEventListener('error', (e) => {
      isConnected.value = false
      error.value = 'Connection lost'
      es?.close()
    })

    es.onerror = () => {
      isConnected.value = false
    }
  }

  function disconnect() {
    es?.close()
    isConnected.value = false
  }

  const progress = computed(() => {
    if (!job.value) return 0
    const done = job.value.steps.filter((s) => s.status === 'done' || s.status === 'skipped').length
    return Math.round((done / job.value.steps.length) * 100)
  })

  const currentStepLabel = computed(() => {
    if (!job.value) return ''
    return job.value.steps.find((s) => s.status === 'running')?.label ?? ''
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    job,
    isConnected,
    error,
    progress,
    currentStepLabel,
    startProvision,
    subscribeToJob,
    disconnect,
  }
}
