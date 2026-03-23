<script setup lang="ts">
import { useProvision } from '~/composables/useProvision'
import { useApps } from '~/composables/useApps'

definePageMeta({ layout: 'default' })

const { apps } = useApps()
const {
  job, isConnected, error, progress, currentStepLabel, isSimulate,
  simulate, startProvision,
} = useProvision()

type Mode = 'simulate' | 'provision'
const mode = ref<Mode>('simulate')
const isSubmitting = ref(false)
const submitted = ref(false)

const form = reactive({
  appId: '',
  // provision-only fields
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
  { value: 'asia-east1', label: 'Asia East (Taiwan)' },
]

const canSubmit = computed(() => {
  if (!form.appId || isSubmitting.value) return false
  if (mode.value === 'provision') return !!form.gcpProjectId
  return true // simulate only needs appId
})

async function handleSubmit() {
  if (!canSubmit.value || !selectedApp.value) return
  isSubmitting.value = true
  submitted.value = true

  try {
    if (mode.value === 'simulate') {
      await simulate({
        appId: form.appId,
        appName: (selectedApp.value as any).name,
        slug: (selectedApp.value as any).slug,
        appConfig: selectedApp.value,
      })
    } else {
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
    }
  } catch (e: any) {
    isSubmitting.value = false
    submitted.value = false
  }
}

// When job finishes, clear isSubmitting
watch(() => job.value?.status, (s) => {
  if (s === 'done' || s === 'error') isSubmitting.value = false
})

const stepIcon = (status: string) => ({
  done: '✓', error: '✗', skipped: '—', running: null, pending: '○',
}[status] ?? '○')

const stepClass = (status: string) => ({
  done:    'text-green-600 bg-green-50 border-green-200',
  error:   'text-red-600 bg-red-50 border-red-200',
  running: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  skipped: 'text-gray-400 bg-gray-50 border-gray-100',
}[status] ?? 'text-gray-400 bg-white border-gray-200')
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <NuxtLink to="/" class="hover:text-gray-700 transition-colors">Dashboard</NuxtLink>
        <span>/</span>
        <NuxtLink to="/infra" class="hover:text-gray-700 transition-colors">Infrastructure</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 font-medium">New</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Register Infrastructure</h1>
      <p class="text-gray-500 mt-1">Run locally in Docker or provision real GCP resources.</p>
    </div>

    <!-- Mode toggle -->
    <div class="flex gap-2 mb-8 p-1 bg-gray-100 rounded-2xl w-fit">
      <button
        v-for="m in [
          { value: 'simulate', label: '🐳 Local (Docker)', desc: 'No GCP needed' },
          { value: 'provision', label: '☁️ GCP Infra', desc: 'Provision real resources' },
        ]"
        :key="m.value"
        type="button"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
        :class="mode === m.value
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'"
        :disabled="submitted"
        @click="mode = m.value as Mode"
      >
        {{ m.label }}
        <span class="text-xs font-normal opacity-60">{{ m.desc }}</span>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <!-- Form -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-5">
          {{ mode === 'simulate' ? '🐳 Local Docker Configuration' : '☁️ GCP Configuration' }}
        </h2>

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
                {{ (app as any).theme?.emoji }} {{ (app as any).name }} — /{{ (app as any).slug }}
              </option>
            </select>
            <!-- App preview chip -->
            <div
              v-if="selectedApp"
              class="mt-2 flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-gray-50"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                :style="{
                  background: `linear-gradient(135deg, ${(selectedApp as any).theme?.gradient?.[0]}, ${(selectedApp as any).theme?.gradient?.[1]})`,
                }"
              >
                {{ (selectedApp as any).theme?.emoji }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-gray-800 truncate">{{ (selectedApp as any).name }}</p>
                <p class="text-xs text-gray-400 font-mono">
                  {{ (selectedApp as any).features?.length ?? 0 }} features · {{ (selectedApp as any).topic }}
                </p>
              </div>
            </div>
          </div>

          <!-- ── Simulate mode: info box ─────────────────────────────── -->
          <div
            v-if="mode === 'simulate'"
            class="p-4 bg-violet-50 border border-violet-100 rounded-xl text-sm text-violet-800"
          >
            <p class="font-semibold mb-2">What happens locally:</p>
            <ul class="space-y-1 text-violet-700 text-xs">
              <li>🐳 Docker builds <code class="bg-violet-100 px-1 rounded">sass-factory/template:latest</code></li>
              <li>📁 Config written to <code class="bg-violet-100 px-1 rounded">.dev-configs/{{ (selectedApp as any)?.slug || '{slug}' }}.json</code></li>
              <li>▶ Container starts at <code class="bg-violet-100 px-1 rounded">http://localhost:301x</code></li>
              <li>✓ Health check passes — app is ready</li>
            </ul>
            <p class="mt-2 text-xs text-violet-500">Requires Docker Desktop running.</p>
          </div>

          <!-- ── Provision mode: GCP fields ─────────────────────────── -->
          <template v-if="mode === 'provision'">
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

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
              <select
                v-model="form.region"
                :disabled="submitted"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              >
                <option v-for="r in regions" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
            </div>

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
          </template>

          <!-- Submit -->
          <button
            type="button"
            :disabled="!canSubmit"
            class="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
            :class="canSubmit
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
            @click="handleSubmit"
          >
            <svg v-if="isSubmitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span v-if="mode === 'simulate'">
              {{ isSubmitting ? 'Building & running…' : '🐳 Run in Docker' }}
            </span>
            <span v-else>
              {{ isSubmitting ? 'Provisioning…' : '☁️ Provision GCP Infra' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Progress panel -->
      <div class="space-y-4">
        <!-- Idle -->
        <div
          v-if="!submitted"
          class="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center gap-3"
        >
          <div class="text-4xl">{{ mode === 'simulate' ? '🐳' : '⚡' }}</div>
          <p class="text-sm font-medium text-gray-600">
            {{ mode === 'simulate' ? 'Docker simulation progress' : 'Provisioning progress' }}
          </p>
          <p class="text-xs text-gray-400">
            {{ mode === 'simulate'
              ? 'Select an app and click "Run in Docker" to see real-time build progress.'
              : 'Fill in the form and click "Provision" to see real-time infrastructure progress.' }}
          </p>
        </div>

        <!-- Active -->
        <div v-else class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <!-- Header -->
          <div class="p-5 border-b border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-sm font-semibold text-gray-900">
                  {{ isSimulate ? '🐳 Local Docker' : '☁️ GCP Infra' }}
                  <span class="ml-2 text-xs font-normal text-gray-400">{{ job?.appName }}</span>
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  <span v-if="isConnected" class="inline-flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"/>
                    {{ currentStepLabel || 'Starting…' }}
                  </span>
                  <span v-else-if="job?.status === 'done'" class="text-green-600 font-medium">✓ Complete</span>
                  <span v-else-if="job?.status === 'error'" class="text-red-600 font-medium">✗ Failed</span>
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
            <p class="text-xs text-gray-400 mt-1.5 text-right">{{ progress }}%</p>
          </div>

          <!-- Steps -->
          <div class="p-4 space-y-2">
            <div
              v-for="step in (job?.steps ?? [])"
              :key="step.key"
              class="flex items-center gap-3 p-3 rounded-xl border transition-all"
              :class="stepClass(step.status)"
            >
              <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
                <svg v-if="step.status === 'running'" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span v-else>{{ stepIcon(step.status) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ step.label }}</p>
                <p v-if="step.message" class="text-xs opacity-60 truncate mt-0.5">{{ step.message }}</p>
              </div>
              <span
                v-if="step.completedAt && step.startedAt"
                class="text-xs opacity-50 font-mono shrink-0"
              >
                {{ ((step.completedAt - step.startedAt) / 1000).toFixed(1) }}s
              </span>
            </div>
          </div>

          <!-- Success -->
          <div v-if="job?.status === 'done'" class="m-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <p class="text-sm font-semibold text-green-800 mb-3">
              {{ isSimulate ? '🐳 Running locally!' : '🎉 Deployed!' }}
            </p>
            <div class="space-y-1.5">
              <a
                v-if="job.result?.localUrl"
                :href="job.result.localUrl"
                target="_blank"
                class="flex items-center gap-2 text-xs text-green-700 hover:underline font-mono"
              >
                🌐 {{ job.result.localUrl }}
              </a>
              <a
                v-if="job.result?.hostingUrl"
                :href="job.result.hostingUrl"
                target="_blank"
                class="flex items-center gap-2 text-xs text-green-700 hover:underline font-mono"
              >
                🌐 {{ job.result.hostingUrl }}
              </a>
              <a
                v-if="job.result?.cloudRunUrl"
                :href="job.result.cloudRunUrl"
                target="_blank"
                class="flex items-center gap-2 text-xs text-green-700 hover:underline font-mono"
              >
                ☁️ {{ job.result.cloudRunUrl }}
              </a>
            </div>
            <div class="flex gap-2 mt-4">
              <a
                :href="job.result?.localUrl || job.result?.hostingUrl"
                target="_blank"
                class="flex-1 py-2 text-center text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Open App ↗
              </a>
              <NuxtLink to="/" class="flex-1 py-2 text-center text-xs font-medium bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-50">
                Dashboard
              </NuxtLink>
            </div>
          </div>

          <!-- Error -->
          <div v-if="job?.status === 'error'" class="m-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <p class="text-sm font-semibold text-red-800 mb-1">Failed</p>
            <p class="text-xs text-red-600">{{ job.error }}</p>
            <button
              type="button"
              class="mt-3 w-full py-2 text-xs font-medium bg-white text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
              @click="submitted = false; isSubmitting = false"
            >
              Try again
            </button>
          </div>
        </div>

        <!-- Connection error -->
        <div v-if="error" class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          ⚠️ {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>
