<script setup lang="ts">
import { useCloudBuildDeploy } from '~/composables/useCloudBuildDeploy'
import { useApps } from '~/composables/useApps'

definePageMeta({ layout: 'default' })

const { apps } = useApps()
const { build, isDeploying, error, progress, currentStep, isDone, deploy, stepStatusClass } = useCloudBuildDeploy()

const form = reactive({
  appId: '',
  gcpOrgId: '',
  billingAccount: '',
  region: 'us-central1',
})

const selectedApp = computed(() => apps.value?.find((a: any) => a.id === form.appId))
const canDeploy = computed(() => form.appId && form.gcpOrgId && form.billingAccount && !isDeploying.value)

const regions = [
  { value: 'us-central1', label: 'US Central (Iowa)' },
  { value: 'us-east1', label: 'US East (South Carolina)' },
  { value: 'europe-west1', label: 'Europe West (Belgium)' },
  { value: 'asia-east1', label: 'Asia East (Taiwan)' },
]

async function handleDeploy() {
  if (!canDeploy.value || !selectedApp.value) return
  await deploy({
    appId: form.appId,
    slug: (selectedApp.value as any).slug,
    gcpOrgId: form.gcpOrgId,
    billingAccount: form.billingAccount,
    region: form.region,
  })
}

function durationSec(step: any) {
  if (!step.startTime || !step.endTime) return null
  const s = new Date(step.startTime).getTime()
  const e = new Date(step.endTime).getTime()
  return ((e - s) / 1000).toFixed(1)
}

const stepIcon = (status: string) => ({
  WORKING: null,   // spinner
  SUCCESS: '✓',
  FAILURE: '✗',
  CANCELLED: '—',
  QUEUED: '○',
  PENDING: '○',
}[status] ?? '○')
</script>

<template>
  <div>
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <NuxtLink to="/" class="hover:text-gray-700">Dashboard</NuxtLink>
        <span>/</span>
        <NuxtLink to="/infra" class="hover:text-gray-700">Infrastructure</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 font-medium">Deploy to GCP</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Deploy to GCP</h1>
      <p class="text-gray-500 mt-1">Create a new GCP project and deploy the app automatically.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <!-- Deploy form -->
      <div class="space-y-4">
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-5">Configuration</h2>
          <div class="space-y-4">
            <!-- App selector -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">App <span class="text-red-500">*</span></label>
              <select v-model="form.appId" :disabled="isDeploying"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
                <option value="">Select app...</option>
                <option v-for="app in apps" :key="(app as any).id" :value="(app as any).id">
                  {{ (app as any).theme?.emoji }} {{ (app as any).name }}
                </option>
              </select>
              <div v-if="selectedApp" class="mt-2 flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  :style="{ background: `linear-gradient(135deg, ${(selectedApp as any).theme?.gradient?.[0]}, ${(selectedApp as any).theme?.gradient?.[1]})` }">
                  {{ (selectedApp as any).theme?.emoji }}
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-700">{{ (selectedApp as any).name }}</p>
                  <p class="text-xs text-gray-400 font-mono">slug: {{ (selectedApp as any).slug }}</p>
                </div>
              </div>
            </div>

            <!-- GCP Org ID -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">GCP Organization ID <span class="text-red-500">*</span></label>
              <input v-model="form.gcpOrgId" :disabled="isDeploying" type="text"
                placeholder="123456789012"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50" />
              <p class="text-xs text-gray-400 mt-1">Find it: <code class="bg-gray-100 px-1 rounded">gcloud organizations list</code></p>
            </div>

            <!-- Billing Account -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Billing Account <span class="text-red-500">*</span></label>
              <input v-model="form.billingAccount" :disabled="isDeploying" type="text"
                placeholder="XXXXXX-XXXXXX-XXXXXX"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50" />
              <p class="text-xs text-gray-400 mt-1">Find it: <code class="bg-gray-100 px-1 rounded">gcloud billing accounts list</code></p>
            </div>

            <!-- Region -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
              <select v-model="form.region" :disabled="isDeploying"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
                <option v-for="r in regions" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
            </div>

            <!-- Deploy button -->
            <button :disabled="!canDeploy" @click="handleDeploy"
              class="w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
              :class="canDeploy ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'">
              <svg v-if="isDeploying" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ isDeploying ? 'Deploying…' : '🚀 Deploy to GCP' }}
            </button>
          </div>
        </div>

        <!-- What gets created info box -->
        <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-sm">
          <p class="font-semibold text-indigo-900 mb-3">What gets created</p>
          <ul class="space-y-2 text-indigo-700">
            <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0">📁</span> New GCP project <code class="bg-indigo-100 px-1 rounded text-xs">sass-{slug}-xxxxx</code></li>
            <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0">🐳</span> Docker image built &amp; pushed to Artifact Registry</li>
            <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0">☁️</span> Cloud Run service with <code class="bg-indigo-100 px-1 rounded text-xs">APP_SLUG</code> env</li>
            <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0">🔥</span> Firebase project linked to GCP project</li>
            <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0">🔒</span> Firestore security rules deployed</li>
          </ul>
        </div>
      </div>

      <!-- Build progress -->
      <div class="space-y-4">
        <!-- Idle -->
        <div v-if="!build && !isDeploying"
          class="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div class="text-4xl mb-3">🚀</div>
          <p class="text-sm font-medium text-gray-600">Build progress</p>
          <p class="text-xs text-gray-400 mt-1">Configure and click Deploy to see real-time pipeline progress.</p>
        </div>

        <!-- Active build -->
        <div v-else class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <!-- Header -->
          <div class="p-5 border-b border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-sm font-semibold text-gray-900">Cloud Build Pipeline</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  <span v-if="isDeploying" class="inline-flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block"/>
                    {{ currentStep || 'Starting…' }}
                  </span>
                  <a v-if="build?.logUrl" :href="build.logUrl" target="_blank"
                    class="text-indigo-500 hover:underline ml-2">View full logs ↗</a>
                </p>
              </div>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
                :class="{
                  'bg-indigo-100 text-indigo-700': ['WORKING','QUEUED','PENDING'].includes(build?.status ?? ''),
                  'bg-green-100 text-green-700': build?.status === 'SUCCESS',
                  'bg-red-100 text-red-700': ['FAILURE','CANCELLED','TIMEOUT'].includes(build?.status ?? ''),
                  'bg-gray-100 text-gray-500': !build,
                }">
                {{ build?.status ?? 'QUEUED' }}
              </span>
            </div>
            <!-- Progress bar -->
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                :class="build?.status === 'FAILURE' ? 'bg-red-400' : 'bg-indigo-500'"
                :style="{ width: `${progress}%` }"/>
            </div>
            <div class="flex justify-between mt-1.5">
              <span v-if="build?.buildId" class="text-xs text-gray-400 font-mono">{{ build.buildId.slice(0, 12) }}…</span>
              <span class="text-xs text-gray-400 ml-auto">{{ progress }}%</span>
            </div>
          </div>

          <!-- Steps -->
          <div class="p-4 space-y-2">
            <div v-for="step in (build?.steps ?? [])" :key="step.id"
              class="flex items-center gap-3 p-3 rounded-xl border transition-all"
              :class="stepStatusClass(step.status)">
              <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
                <svg v-if="step.status === 'WORKING'" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span v-else>{{ stepIcon(step.status) }}</span>
              </div>
              <p class="flex-1 text-sm font-medium">{{ step.label }}</p>
              <span v-if="durationSec(step)" class="text-xs opacity-60 font-mono shrink-0">
                {{ durationSec(step) }}s
              </span>
            </div>
          </div>

          <!-- Success result -->
          <div v-if="build?.status === 'SUCCESS'"
            class="m-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <p class="text-sm font-semibold text-green-800 mb-3">🎉 Deployed!</p>
            <div class="space-y-1.5">
              <a :href="`https://${build.appProjectId}.web.app`" target="_blank"
                class="flex items-center gap-2 text-xs text-green-700 hover:underline font-mono">
                🌐 https://{{ build.appProjectId }}.web.app
              </a>
            </div>
            <div class="flex gap-2 mt-4">
              <a :href="`https://${build.appProjectId}.web.app`" target="_blank"
                class="flex-1 py-2 text-center text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">
                Open App ↗
              </a>
              <NuxtLink to="/" class="flex-1 py-2 text-center text-xs font-medium bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-50">
                Dashboard
              </NuxtLink>
            </div>
          </div>

          <!-- Failure card -->
          <div v-if="['FAILURE','TIMEOUT','CANCELLED'].includes(build?.status ?? '')"
            class="m-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <p class="text-sm font-semibold text-red-800 mb-1">Build failed</p>
            <a v-if="build?.logUrl" :href="build.logUrl" target="_blank"
              class="text-xs text-red-600 hover:underline">View Cloud Build logs ↗</a>
          </div>
        </div>

        <!-- Error alert -->
        <div v-if="error" class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          ⚠️ {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>
