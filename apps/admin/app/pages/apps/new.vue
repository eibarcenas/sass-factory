<script setup lang="ts">
import type { AppConfig, AppFeature, AppTheme, AppTopic } from '@sass-factory/core'
import { TOPIC_PRESETS } from '@sass-factory/core'
import { useApps } from '~/composables/useApps'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'default' })

const { createApp } = useApps()
const toast = useToast()
const router = useRouter()

const isSubmitting = ref(false)
const currentStep = ref<'topic' | 'theme' | 'features' | 'metadata'>('topic')

const steps = [
  { key: 'topic', label: 'Topic', icon: '🎯' },
  { key: 'theme', label: 'Theme', icon: '🎨' },
  { key: 'features', label: 'Features', icon: '⚡' },
  { key: 'metadata', label: 'Details', icon: '📝' },
] as const

const form = reactive<{
  topic: AppTopic
  name: string
  slug: string
  status: 'draft' | 'active' | 'archived'
  theme: Partial<AppTheme>
  features: AppFeature[]
  metadata: { title: string; description: string; ogImage?: string }
  domain?: string
}>({
  topic: '',
  name: '',
  slug: '',
  status: 'draft',
  theme: {},
  features: ['hero', 'closing'],
  metadata: { title: '', description: '' },
})

const topics = Object.entries(TOPIC_PRESETS).map(([key, preset]) => ({
  key,
  ...preset,
}))

function selectTopic(topicKey: string) {
  const preset = TOPIC_PRESETS[topicKey]
  if (!preset) return
  form.topic = topicKey
  form.theme = {
    primary: preset.primary ?? '#6366f1',
    secondary: preset.secondary ?? '#a5b4fc',
    accent: preset.accent ?? '#f59e0b',
    background: preset.background ?? '#ffffff',
    font: preset.font ?? 'Inter',
    emoji: preset.emoji ?? '✨',
    gradient: preset.gradient ?? ['#6366f1', '#8b5cf6'],
  }
  if (!form.name) {
    form.name = preset.name
  }
  if (!form.metadata.title) {
    form.metadata.title = preset.name
  }
}

// Auto-generate slug from name
watch(
  () => form.name,
  (val) => {
    if (val && !form.slug) {
      form.slug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50)
    }
  },
)

const stepIndex = computed(() => steps.findIndex((s) => s.key === currentStep.value))

function nextStep() {
  const idx = stepIndex.value
  if (idx < steps.length - 1) {
    currentStep.value = steps[idx + 1].key
  }
}

function prevStep() {
  const idx = stepIndex.value
  if (idx > 0) {
    currentStep.value = steps[idx - 1].key
  }
}

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 'topic':
      return !!form.topic
    case 'theme':
      return !!(form.theme.primary && form.theme.secondary)
    case 'features':
      return form.features.length > 0
    case 'metadata':
      return !!(form.name && form.slug && form.metadata.title)
    default:
      return true
  }
})

const allFeatures: AppFeature[] = [
  'hero',
  'timeline',
  'gallery',
  'letter',
  'feed',
  'moments',
  'music',
  'countdown',
  'closing',
]

const featureMeta: Record<AppFeature, { icon: string; label: string; desc: string }> = {
  hero: { icon: '🏠', label: 'Hero Section', desc: 'Opening banner with title and message' },
  timeline: { icon: '📅', label: 'Timeline', desc: 'Chronological story of moments' },
  gallery: { icon: '🖼️', label: 'Photo Gallery', desc: 'Grid of photos and memories' },
  letter: { icon: '💌', label: 'Personal Letter', desc: 'A heartfelt written message' },
  feed: { icon: '📱', label: 'Social Feed', desc: 'Stream of messages and reactions' },
  moments: { icon: '✨', label: 'Moments', desc: 'Special highlighted moments' },
  music: { icon: '🎵', label: 'Music Player', desc: 'Background music or playlist' },
  countdown: { icon: '⏱️', label: 'Countdown Timer', desc: 'Countdown to a special date' },
  closing: { icon: '🎬', label: 'Closing Section', desc: 'Final message and call-to-action' },
}

function toggleFeature(f: AppFeature) {
  if (form.features.includes(f)) {
    form.features = form.features.filter((x) => x !== f)
  } else {
    form.features = [...form.features, f]
  }
}

async function handleSubmit() {
  if (!canProceed.value) return
  isSubmitting.value = true
  try {
    await createApp({
      topic: form.topic,
      name: form.name,
      slug: form.slug,
      status: form.status,
      theme: form.theme as AppTheme,
      features: form.features,
      metadata: form.metadata,
      domain: form.domain,
    })
    toast.success('App created successfully!')
    router.push('/')
  } catch (e) {
    toast.error('Failed to create app. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Page header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <NuxtLink to="/" class="hover:text-gray-700 transition-colors">Dashboard</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 font-medium">New App</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Create New App</h1>
      <p class="text-gray-500 mt-1">Set up a themed experience in just a few steps.</p>
    </div>

    <!-- Step progress -->
    <div class="flex items-center gap-0 mb-8">
      <div
        v-for="(step, i) in steps"
        :key="step.key"
        class="flex items-center"
        :class="{ 'flex-1': i < steps.length - 1 }"
      >
        <button
          class="flex items-center gap-2 shrink-0"
          :disabled="i > stepIndex"
          @click="i <= stepIndex && (currentStep = step.key)"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
            :class="{
              'bg-indigo-600 text-white': step.key === currentStep,
              'bg-green-500 text-white': i < stepIndex,
              'bg-gray-100 text-gray-400': i > stepIndex,
            }"
          >
            <span v-if="i < stepIndex">✓</span>
            <span v-else>{{ step.icon }}</span>
          </div>
          <span
            class="hidden sm:block text-sm font-medium"
            :class="{
              'text-indigo-600': step.key === currentStep,
              'text-green-600': i < stepIndex,
              'text-gray-400': i > stepIndex,
            }"
          >
            {{ step.label }}
          </span>
        </button>
        <div
          v-if="i < steps.length - 1"
          class="flex-1 h-0.5 mx-3 rounded-full"
          :class="i < stepIndex ? 'bg-green-400' : 'bg-gray-200'"
        />
      </div>
    </div>

    <!-- Step panels -->
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <!-- Step 1: Topic -->
      <div v-if="currentStep === 'topic'" class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Choose a Topic</h2>
        <p class="text-sm text-gray-500 mb-6">
          Select the occasion or event for this themed app.
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            v-for="topic in topics"
            :key="topic.key"
            type="button"
            class="relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-150 cursor-pointer"
            :class="
              form.topic === topic.key
                ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            "
            @click="selectTopic(topic.key)"
          >
            <!-- Gradient background -->
            <div
              class="absolute inset-0 rounded-2xl opacity-10"
              :style="{
                background: `linear-gradient(135deg, ${topic.gradient?.[0]}, ${topic.gradient?.[1]})`,
              }"
            />
            <span class="text-4xl relative">{{ topic.emoji }}</span>
            <div class="text-center relative">
              <p class="font-semibold text-gray-900 text-sm leading-tight">{{ topic.name }}</p>
              <p class="text-xs text-gray-500 mt-0.5 font-mono">{{ topic.key }}</p>
            </div>
            <!-- Color dots -->
            <div class="flex gap-1.5 relative">
              <div
                class="w-4 h-4 rounded-full border border-white shadow-sm"
                :style="{ backgroundColor: topic.primary }"
              />
              <div
                class="w-4 h-4 rounded-full border border-white shadow-sm"
                :style="{ backgroundColor: topic.secondary }"
              />
              <div
                class="w-4 h-4 rounded-full border border-white shadow-sm"
                :style="{ backgroundColor: topic.accent }"
              />
            </div>
            <!-- Selected indicator -->
            <div
              v-if="form.topic === topic.key"
              class="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center"
            >
              <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </button>

          <!-- Custom topic -->
          <button
            type="button"
            class="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-dashed transition-all duration-150 cursor-pointer"
            :class="
              form.topic && !TOPIC_PRESETS[form.topic]
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            "
            @click="form.topic = 'custom'"
          >
            <span class="text-4xl">🎨</span>
            <div class="text-center">
              <p class="font-semibold text-gray-900 text-sm">Custom</p>
              <p class="text-xs text-gray-400 mt-0.5">Build your own</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: Theme -->
      <div v-else-if="currentStep === 'theme'" class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Customize Theme</h2>
        <p class="text-sm text-gray-500 mb-6">
          Fine-tune the colors and typography for your app.
        </p>

        <!-- Live preview -->
        <div
          class="h-32 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden"
          :style="{
            background: `linear-gradient(135deg, ${form.theme.gradient?.[0] ?? '#e2e8f0'}, ${form.theme.gradient?.[1] ?? '#cbd5e1'})`,
          }"
        >
          <div class="text-center text-white drop-shadow-md">
            <p class="text-5xl mb-2">{{ form.theme.emoji ?? '✨' }}</p>
            <p
              class="font-bold text-xl"
              :style="{ fontFamily: form.theme.font ?? 'inherit' }"
            >
              Preview
            </p>
          </div>
        </div>

        <div class="space-y-5">
          <!-- Color pickers -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-3">Colors</h4>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="field in [
                  { key: 'primary', label: 'Primary' },
                  { key: 'secondary', label: 'Secondary' },
                  { key: 'accent', label: 'Accent' },
                  { key: 'background', label: 'Background' },
                ]"
                :key="field.key"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div class="relative shrink-0">
                  <div
                    class="w-10 h-10 rounded-lg shadow-sm border-2 border-white overflow-hidden"
                    :style="{ backgroundColor: (form.theme as any)[field.key] || '#ffffff' }"
                  >
                    <input
                      type="color"
                      class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      :value="(form.theme as any)[field.key] || '#ffffff'"
                      @input="(form.theme as any)[field.key] = ($event.target as HTMLInputElement).value"
                    />
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-medium text-gray-700">{{ field.label }}</p>
                  <p class="text-xs text-gray-400 font-mono truncate">
                    {{ (form.theme as any)[field.key] || '—' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Font -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Font Family</h4>
            <select
              v-model="form.theme.font"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a font...</option>
              <option
                v-for="font in [
                  'Playfair Display',
                  'Cinzel',
                  'Lora',
                  'Merriweather',
                  'Nunito',
                  'Mountains of Christmas',
                  'Inter',
                  'Poppins',
                  'Roboto',
                  'Open Sans',
                ]"
                :key="font"
                :value="font"
              >
                {{ font }}
              </option>
            </select>
          </div>

          <!-- Emoji -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Main Emoji</h4>
            <input
              v-model="form.theme.emoji"
              type="text"
              placeholder="❤️"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <!-- Step 3: Features -->
      <div v-else-if="currentStep === 'features'" class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Select Features</h2>
        <p class="text-sm text-gray-500 mb-6">
          Choose which sections to include in your app.
          <span class="font-medium text-gray-700">{{ form.features.length }} selected</span>
        </p>

        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="feature in allFeatures"
            :key="feature"
            type="button"
            class="flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-150 text-left"
            :class="
              form.features.includes(feature)
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            "
            @click="toggleFeature(feature)"
          >
            <span class="text-xl shrink-0">{{ featureMeta[feature].icon }}</span>
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium"
                :class="form.features.includes(feature) ? 'text-indigo-900' : 'text-gray-800'"
              >
                {{ featureMeta[feature].label }}
              </p>
              <p class="text-xs text-gray-400 truncate">{{ featureMeta[feature].desc }}</p>
            </div>
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="
                form.features.includes(feature)
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-gray-300 bg-white'
              "
            >
              <svg
                v-if="form.features.includes(feature)"
                class="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <!-- Step 4: Metadata -->
      <div v-else-if="currentStep === 'metadata'" class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">App Details</h2>
        <p class="text-sm text-gray-500 mb-6">Configure the app's name, URL, and metadata.</p>

        <div class="space-y-5">
          <!-- App name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              App Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Happy Valentine's Day"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Slug -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              URL Slug <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
              <span class="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 shrink-0">
                app.factory.com/
              </span>
              <input
                v-model="form.slug"
                type="text"
                placeholder="my-app-slug"
                class="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
              />
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <div class="flex gap-2">
              <button
                v-for="s in ['draft', 'active', 'archived']"
                :key="s"
                type="button"
                class="flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium capitalize transition-all"
                :class="
                  form.status === s
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                "
                @click="form.status = s as any"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <!-- Meta title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Page Title <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.metadata.title"
              type="text"
              placeholder="e.g. Happy Valentine's Day, My Love"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Meta description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
            <textarea
              v-model="form.metadata.description"
              rows="3"
              placeholder="A short description of your app..."
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <!-- Custom domain -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Custom Domain
              <span class="text-xs text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              v-model="form.domain"
              type="text"
              placeholder="e.g. valentines.example.com"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation buttons -->
    <div class="flex items-center justify-between mt-6">
      <button
        v-if="stepIndex > 0"
        type="button"
        class="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        @click="prevStep"
      >
        ← Back
      </button>
      <div v-else />

      <button
        v-if="currentStep !== 'metadata'"
        type="button"
        class="px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-colors"
        :class="
          canProceed
            ? 'bg-indigo-600 hover:bg-indigo-700'
            : 'bg-indigo-200 cursor-not-allowed'
        "
        :disabled="!canProceed"
        @click="nextStep"
      >
        Continue →
      </button>

      <button
        v-else
        type="button"
        class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-xl transition-colors"
        :class="
          canProceed && !isSubmitting
            ? 'bg-indigo-600 hover:bg-indigo-700'
            : 'bg-indigo-200 cursor-not-allowed'
        "
        :disabled="!canProceed || isSubmitting"
        @click="handleSubmit"
      >
        <svg
          v-if="isSubmitting"
          class="animate-spin w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        {{ isSubmitting ? 'Creating...' : 'Create App ✨' }}
      </button>
    </div>
  </div>
</template>
