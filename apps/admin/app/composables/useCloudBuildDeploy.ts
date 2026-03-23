interface BuildStep {
  id: string
  label: string
  status: string
  startTime?: string
  endTime?: string
}

interface BuildState {
  buildId: string
  status: string
  logUrl?: string
  steps: BuildStep[]
  appProjectId?: string
}

export function useCloudBuildDeploy() {
  const build = ref<BuildState | null>(null)
  const isDeploying = ref(false)
  const error = ref<string | null>(null)
  let es: EventSource | null = null

  const progress = computed(() => {
    if (!build.value?.steps?.length) return 0
    const done = build.value.steps.filter(
      (s) => s.status === 'SUCCESS'
    ).length
    return Math.round((done / build.value.steps.length) * 100)
  })

  const currentStep = computed(() =>
    build.value?.steps?.find((s) => s.status === 'WORKING')?.label ?? ''
  )

  const isDone = computed(() =>
    ['SUCCESS', 'FAILURE', 'CANCELLED', 'TIMEOUT'].includes(build.value?.status ?? '')
  )

  async function deploy(payload: {
    appId: string
    slug: string
    gcpOrgId: string
    billingAccount: string
    region?: string
  }) {
    isDeploying.value = true
    error.value = null
    build.value = null

    try {
      const result = await $fetch<{
        buildId: string
        appProjectId: string
        logUrl: string
        status: string
      }>('/api/infra/deploy', { method: 'POST', body: payload })

      build.value = {
        buildId: result.buildId,
        appProjectId: result.appProjectId,
        status: result.status,
        logUrl: result.logUrl,
        steps: [],
      }

      subscribeToStream(result.buildId)
      return result
    } catch (e: any) {
      error.value = e.data?.message ?? e.message
      isDeploying.value = false
      throw e
    }
  }

  function subscribeToStream(buildId: string) {
    es?.close()
    es = new EventSource(`/api/infra/${buildId}/cloud-build-stream`)

    es.addEventListener('update', (e) => {
      try {
        const data = JSON.parse(e.data)
        build.value = { ...build.value!, ...data }
      } catch {}
    })

    es.addEventListener('done', (e) => {
      try {
        const data = JSON.parse(e.data)
        build.value = { ...build.value!, ...data }
      } catch {}
      isDeploying.value = false
      es?.close()
    })

    es.addEventListener('error', () => {
      error.value = 'Stream disconnected'
      isDeploying.value = false
    })
  }

  const stepStatusClass = (status: string) => ({
    'WORKING': 'text-indigo-600 bg-indigo-50 border-indigo-200',
    'SUCCESS': 'text-green-600 bg-green-50 border-green-200',
    'FAILURE': 'text-red-600 bg-red-50 border-red-200',
    'QUEUED':  'text-gray-400 bg-gray-50 border-gray-200',
    'PENDING': 'text-gray-400 bg-gray-50 border-gray-200',
  }[status] ?? 'text-gray-400 bg-white border-gray-200')

  onUnmounted(() => es?.close())

  return {
    build, isDeploying, error, progress, currentStep, isDone,
    deploy, stepStatusClass,
  }
}
