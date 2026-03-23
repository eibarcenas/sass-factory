<script setup lang="ts">
import { useProvision } from '~/composables/useProvision'
import { useApps } from '~/composables/useApps'

definePageMeta({ layout: 'default' })

const { apps } = useApps()
const { job, isConnected, error, progress, currentStepLabel, startProvision } = useProvision()

const isSubmitting = ref(false)
const submitted = ref(false)

const form = reactive({
  appId: '',
  gcpProjectId: '',
  firebaseProjectId: '',
  region: 'us-central1',
  domain: '',
})

const selectedApp = computed(() => apps.value?.find((a: any) => a.id === form.appId))

const regions = [
  { value: 'us-central1', label: 'US Central (Iowa)' },
  { value: 'us-east1', label: 'US East (South Carolina)' },
  { value: 'us-west1', label: 'US West (Oregon)' },
  { value: 'europe-west1', label: 'Europe West (Belgium)' },
  { value: 'europe-west3', label: 'Europe West (Frankfurt)' },
  { value: 'asia-east1', label: 'Asia East (Taiwan)' },
  { value: 'asia-southeast1', label: 'Asia Southeast (Singapore)' },
]

const canSubmit = computed(
  () => form.appId && form.gcpProjectId && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value || !selectedApp.value) return
  isSubmitting.value = true
  submitted.value = true

  try {
    await startProvision({
      appId: form.appId,
      appName: (selectedApp.value as any).name,
      slug: (selectedApp.value as any).slug,
      topic: (selectedApp.value as any).topic,
      gcpProjectId: form.gcpProjectId,
      firebaseProjectId: form.firebaseProjectId || form.gcpProjectId,
      region: form.region,
      domain: form.domain || undefined,
    })
  } catch (e: any) {
    isSubmitting.value = false
  }
}

const stepIcon = (status: string) => {
  switch (status) {
    case 'done': return '✓'
    case 'error': return '✗'
    case 'skipped': return '—'
    case 'running': return null // spinner
    default: return '○'
  }
}

const stepClass = (status: string) => {
  switch (status) {
    case 'done': return 'text-green-600 bg-green-50 border-green-200'
    case 'error': return 'text-red-600 bg-red-50 border-red-200'
    case 'running': return 'text-indigo-600 bg-indigo-50 border-indigo-200'
    case 'skipped': return 'text-gray-400 bg-gray-50 border-gray-100'
    default: return 'text-gray-400 bg-white border-gray-200'
  }
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <NuxtLink to="/" class="hover:text-gray-700 transition-colors">Dashboard</NuxtLink>
        <span>/</span>
        <NuxtLink to="/infra" class="hover:text-gray-700 transition-colors">Infrastructure</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 font-medium">Register New</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Register Infrastructure</h1>
      <p class="text-gray-500 mt-1">Provision GCP + Firebase resources for a themed app.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <!-- Form -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-5">Configuration</h2>

        <div class="space-y-5">
          <!-- App selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              App <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.appId"
              :disabled="submitted"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select an app...</option>
              <option v-for="app in apps" :key="(app as any).id" :value="(app as any).id">
                {{ (app as any).metadata?.emoji || '' }} {{ (app as any).name }} — {{ (app as any).slug }}
              </option>
            </select>
            <p v-if="selectedApp" class="mt-1.5 text-xs text-gray-400">
              Topic: <span class="font-medium text-gray-600">{{ (selectedApp as any).topic }}</span>
              · Features: <span class="font-medium text-gray-600">{{ (selectedApp as any).features?.length ?? 0 }}</span>
            </p>
          </div>

          <!-- GCP Project ID -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              GCP Project ID <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.gcpProjectId"
              :disabled="submitted"
              type="text"
              placeholder="my-gcp-project-123"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <!-- Firebase Project ID -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Firebase Project ID
              <span class="text-xs text-gray-400 font-normal ml-1">(defaults to GCP project)</span>
            </label>
            <input
              v-model="form.firebaseProjectId"
              :disabled="submitted"
              type="text"
              :placeholder="form.gcpProjectId || 'my-firebase-project'"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <!-- Region -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
            <select
              v-model="form.region"
              :disabled="submitted"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            >
              <option v-for="r in regions" :key="r.value" :value="r.value">
                {{ r.label }}
              </option>
            </select>
          </div>

          <!-- Domain -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Custom Domain
              <span class="text-xs text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              v-model="form.domain"
              :disabled="submitted"
              type="text"
              placeholder="app.yourdomain.com"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <!-- Submit -->
          <button
            type="button"
            :disabled="!canSubmit"
            class="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
            :class="canSubmit ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
            @click="handleSubmit"
          >
            <svg v-if="isSubmitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{{ isSubmitting ? 'Provisioning...' : '🚀 Start Provisioning' }}</span>
          </button>
        </div>
      </div>

      <!-- Progress panel -->
      <div class="space-y-4">
        <!-- Idle state -->
        <div
          v-if="!submitted"
          class="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center gap-3"
        >
          <div class="text-4xl">⚡</div>
          <p class="text-sm font-medium text-gray-600">Provisioning progress</p>
          <p class="text-xs text-gray-400">Fill in the form and click "Start Provisioning" to see real-time progress here.</p>
        </div>

        <!-- Active / Done -->
        <div v-else class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <!-- Header with progress bar -->
          <div class="p-5 border-b border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-sm font-semibold text-gray-900">
                  {{ job?.appName ?? form.appId }}
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  <span v-if="isConnected" class="inline-flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    Live — {{ currentStepLabel || 'Connecting...' }}
                  </span>
                  <span v-else-if="job?.status === 'done'" class="text-green-600 font-medium">
                    ✓ Provisioning complete
                  </span>
                  <span v-else-if="job?.status === 'error'" class="text-red-600 font-medium">
                    ✗ Provisioning failed
                  </span>
                  <span v-else>Connecting...</span>
                </p>
              </div>
              <span
                class="text-xs font-semibold px-2.5 py-1 rounded-full"
                :class="{
                  'bg-indigo-100 text-indigo-700': job?.status === 'running' || job?.status === 'queued',
                  'bg-green-100 text-green-700': job?.status === 'done',
                  'bg-red-100 text-red-700': job?.status === 'error',
                  'bg-gray-100 text-gray-500': !job,
                }"
              >
                {{ job?.status ?? 'connecting' }}
              </span>
            </div>

            <!-- Progress bar -->
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="job?.status === 'error' ? 'bg-red-400' : 'bg-indigo-500'"
                :style="{ width: `${progress}%` }"
              />
            </div>
            <p class="text-xs text-gray-400 mt-1.5 text-right">{{ progress }}% complete</p>
          </div>

          <!-- Steps list -->
          <div class="p-4 space-y-2">
            <div
              v-for="step in job?.steps ?? []"
              :key="step.key"
              class="flex items-center gap-3 p-3 rounded-xl border transition-all"
              :class="stepClass(step.status)"
            >
              <!-- Icon -->
              <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
                <svg
                  v-if="step.status === 'running'"
                  class="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span v-else>{{ stepIcon(step.status) }}</span>
              </div>

              <!-- Label -->
              <p class="flex-1 text-sm font-medium">{{ step.label }}</p>

              <!-- Duration -->
              <span
                v-if="step.completedAt && step.startedAt"
                class="text-xs opacity-60 font-mono shrink-0"
              >
                {{ ((step.completedAt - step.startedAt) / 1000).toFixed(1) }}s
              </span>
              <span v-else-if="step.status === 'skipped'" class="text-xs opacity-50 shrink-0">
                skipped
              </span>
            </div>
          </div>

          <!-- Result card -->
          <div
            v-if="job?.status === 'done' && job.result"
            class="m-4 p-4 bg-green-50 rounded-xl border border-green-200"
          >
            <p class="text-sm font-semibold text-green-800 mb-3">🎉 Deployed successfully!</p>
            <div class="space-y-2">
              <a
                v-if="job.result.hostingUrl"
                :href="job.result.hostingUrl"
                target="_blank"
                class="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-mono group"
              >
                <span class="opacity-50">🌐</span>
                <span class="group-hover:underline truncate">{{ job.result.hostingUrl }}</span>
                <span class="opacity-0 group-hover:opacity-50 text-xs">↗</span>
              </a>
              <a
                v-if="job.result.cloudRunUrl"
                :href="job.result.cloudRunUrl"
                target="_blank"
                class="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-mono group"
              >
                <span class="opacity-50">☁️</span>
                <span class="group-hover:underline truncate">{{ job.result.cloudRunUrl }}</span>
                <span class="opacity-0 group-hover:opacity-50 text-xs">↗</span>
              </a>
              <a
                v-if="job.result.domain"
                :href="`https://${job.result.domain}`"
                target="_blank"
                class="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-mono group"
              >
                <span class="opacity-50">🔗</span>
                <span class="group-hover:underline truncate">{{ job.result.domain }}</span>
                <span class="opacity-0 group-hover:opacity-50 text-xs">↗</span>
              </a>
            </div>
            <div class="flex gap-2 mt-4">
              <NuxtLink
                :to="`/apps/${job.appId}`"
                class="flex-1 py-2 text-center text-xs font-medium bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                View App Config
              </NuxtLink>
              <NuxtLink
                to="/"
                class="flex-1 py-2 text-center text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Dashboard →
              </NuxtLink>
            </div>
          </div>

          <!-- Error card -->
          <div
            v-if="job?.status === 'error'"
            class="m-4 p-4 bg-red-50 rounded-xl border border-red-200"
          >
            <p class="text-sm font-semibold text-red-800 mb-1">Provisioning failed</p>
            <p class="text-xs text-red-600">{{ job.error }}</p>
            <button
              type="button"
              class="mt-3 w-full py-2 text-xs font-medium bg-white text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              @click="submitted = false; isSubmitting = false"
            >
              Try again
            </button>
          </div>
        </div>

        <!-- Connection error -->
        <div
          v-if="error"
          class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800"
        >
          ⚠️ {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>
