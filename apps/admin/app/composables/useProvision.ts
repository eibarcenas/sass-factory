import type { ProvisionJob } from '~/server/utils/job-store'

export type ProvisionMode = 'simulate' | 'provision'

export function useProvision() {
  const job = ref<ProvisionJob | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  let es: EventSource | null = null

  // ── Start ────────────────────────────────────────────────────────────────

  /** Local Docker simulation — no GCP needed */
  async function simulate(payload: {
    appId: string
    appName: string
    slug: string
    appConfig?: unknown
  }) {
    error.value = null
    job.value = null
    const data = await $fetch<{ jobId: string }>('/api/infra/simulate', {
      method: 'POST',
      body: payload,
    })
    subscribeToJob(data.jobId)
    return data.jobId
  }

  /** Full infra provisioning (fake/GCP) */
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
    const data = await $fetch<{ jobId: string }>('/api/infra/register', {
      method: 'POST',
      body: payload,
    })
    subscribeToJob(data.jobId)
    return data.jobId
  }

  // ── SSE ──────────────────────────────────────────────────────────────────

  function subscribeToJob(jobId: string) {
    es?.close()
    es = new EventSource(`/api/infra/${jobId}/stream`)
    isConnected.value = true

    es.addEventListener('update', (e) => {
      try { job.value = JSON.parse(e.data) } catch {}
    })

    es.addEventListener('done', (e) => {
      try { job.value = JSON.parse(e.data) } catch {}
      isConnected.value = false
      es?.close()
    })

    es.addEventListener('error', () => {
      isConnected.value = false
      error.value = 'Connection lost'
      es?.close()
    })

    es.onerror = () => { isConnected.value = false }
  }

  function disconnect() {
    es?.close()
    isConnected.value = false
  }

  // ── Computed ─────────────────────────────────────────────────────────────

  const progress = computed(() => {
    if (!job.value) return 0
    const done = job.value.steps.filter(
      (s) => s.status === 'done' || s.status === 'skipped',
    ).length
    return Math.round((done / job.value.steps.length) * 100)
  })

  const currentStepLabel = computed(
    () => job.value?.steps.find((s) => s.status === 'running')?.label ?? '',
  )

  const isSimulate = computed(() => job.value?.mode === 'simulate')

  onUnmounted(disconnect)

  return {
    job,
    isConnected,
    error,
    progress,
    currentStepLabel,
    isSimulate,
    simulate,
    startProvision,
    subscribeToJob,
    disconnect,
  }
}
