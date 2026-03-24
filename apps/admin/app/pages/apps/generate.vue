<script setup lang="ts">
import type { AppConfig } from '@sass-factory/core'
import { useApps } from '~/composables/useApps'
import { useToast } from '~/composables/useToast'

const { isGenerating, streamedText, config, error, generate, reset } = useGenerate()
const { createApp } = useApps()
const { add: toast } = useToast()
const { emit: notify } = useNotifications()
const router = useRouter()

const prompt = ref('')
const isSaving = ref(false)

const EXAMPLES = [
  { label: 'Taller mecánico', icon: '🔧' },
  { label: 'Herrero artesanal', icon: '⚒️' },
  { label: 'Panadería local', icon: '🥖' },
  { label: 'Salon de belleza', icon: '💅' },
  { label: 'Gym & fitness', icon: '💪' },
  { label: 'Restaurante familiar', icon: '🍽️' },
  { label: 'Software agency', icon: '💻' },
  { label: 'Tattoo studio', icon: '🎨' },
]

function useExample(label: string) {
  prompt.value = label
}

async function handleGenerate() {
  if (!prompt.value.trim() || isGenerating.value) return
  await generate(prompt.value.trim())
}

async function handleSave() {
  if (!config.value) return
  isSaving.value = true
  try {
    const result = await createApp(config.value)
    const appId = (result as any)?.id ?? config.value.slug
    await notify({
      type: 'app_created',
      title: `App created: ${config.value.name}`,
      message: `${config.value.theme.emoji} ${config.value.topic} · /${config.value.slug}`,
      link: `/apps/${appId}`,
    })
    toast('App created successfully', 'success')
    router.push('/')
  } catch (err: any) {
    toast(err.message ?? 'Failed to save', 'error')
  } finally {
    isSaving.value = false
  }
}

// Try to parse a partial config preview while streaming
const partialConfig = computed<Partial<AppConfig> | null>(() => {
  if (config.value) return config.value
  if (!streamedText.value) return null
  try {
    // Attempt to parse partial JSON by appending closing braces
    const text = streamedText.value.trim()
    if (!text.startsWith('{')) return null
    const fixed = text + '}'.repeat(10) // rough close
    return JSON.parse(fixed)
  } catch {
    return null
  }
})

const themePreview = computed(() => {
  const t = partialConfig.value?.theme
  if (!t?.primary) return null
  return {
    primary: t.primary,
    secondary: t.secondary ?? '#e5e7eb',
    accent: t.accent ?? t.primary,
    background: t.background ?? '#ffffff',
    font: t.font ?? 'sans-serif',
    emoji: t.emoji ?? '✨',
    gradient: t.gradient ?? [t.primary, t.primary],
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Generate Landing Page</h1>
      <p class="mt-1 text-sm text-gray-500">
        Describe any business or service — Claude will design a complete themed landing page for it.
      </p>
    </div>

    <!-- Prompt input -->
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
      <label class="block text-sm font-medium text-gray-700">Describe your business or idea</label>

      <textarea
        v-model="prompt"
        rows="3"
        placeholder="e.g. Taller mecánico en Monterrey especializado en autos americanos..."
        class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        :disabled="isGenerating"
        @keydown.meta.enter="handleGenerate"
        @keydown.ctrl.enter="handleGenerate"
      />

      <!-- Examples -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="ex in EXAMPLES"
          :key="ex.label"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          :disabled="isGenerating"
          @click="useExample(ex.label)"
        >
          <span>{{ ex.icon }}</span>
          {{ ex.label }}
        </button>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          :disabled="!prompt.trim() || isGenerating"
          @click="handleGenerate"
        >
          <span v-if="isGenerating" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span v-else>✨</span>
          {{ isGenerating ? 'Generating…' : 'Generate' }}
        </button>

        <button
          v-if="config || error"
          class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          @click="reset(); prompt = ''"
        >
          Start over
        </button>

        <p class="ml-auto text-xs text-gray-400 hidden sm:block">
          ⌘ + Enter to generate
        </p>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Streaming / result -->
    <div v-if="isGenerating || config" class="space-y-6">

      <!-- Theme preview bar (shows as soon as colors come in) -->
      <Transition name="fade">
        <div v-if="themePreview" class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <!-- Gradient bar -->
          <div
            class="h-2"
            :style="`background: linear-gradient(to right, ${themePreview.gradient[0]}, ${themePreview.gradient[1] ?? themePreview.gradient[0]})`"
          />

          <div class="p-6 flex items-start gap-5">
            <!-- Emoji + colors -->
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              :style="`background-color: ${themePreview.background}; border: 2px solid ${themePreview.secondary}`"
            >
              {{ themePreview.emoji }}
            </div>

            <div class="flex-1 min-w-0 space-y-3">
              <div class="flex items-center gap-2 flex-wrap">
                <h2
                  class="text-lg font-bold truncate"
                  :style="`color: ${themePreview.primary}; font-family: '${themePreview.font}', sans-serif`"
                >
                  {{ partialConfig?.name ?? '…' }}
                </h2>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" :style="`background: ${themePreview.secondary}; color: ${themePreview.primary}`">
                  {{ partialConfig?.topic ?? '…' }}
                </span>
              </div>

              <p v-if="partialConfig?.metadata?.description" class="text-sm text-gray-600 line-clamp-2">
                {{ partialConfig.metadata.description }}
              </p>

              <!-- Feature chips -->
              <div v-if="partialConfig?.features?.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="f in partialConfig.features"
                  :key="f"
                  class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                >
                  {{ f }}
                </span>
              </div>

              <!-- Color swatches -->
              <div class="flex items-center gap-2">
                <div
                  v-for="(color, key) in { primary: themePreview.primary, secondary: themePreview.secondary, accent: themePreview.accent }"
                  :key="key"
                  class="w-5 h-5 rounded-full border border-white shadow-sm"
                  :style="`background: ${color}`"
                  :title="`${key}: ${color}`"
                />
                <span class="text-xs text-gray-400 font-mono ml-1">{{ themePreview.font }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Raw JSON stream (while generating) -->
      <div v-if="isGenerating" class="bg-gray-950 rounded-2xl p-4 overflow-auto max-h-72">
        <pre class="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">{{ streamedText }}<span class="animate-pulse">▊</span></pre>
      </div>

      <!-- Save button (when done) -->
      <div v-if="config" class="flex items-center gap-3">
        <button
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          :disabled="isSaving"
          @click="handleSave"
        >
          <span v-if="isSaving" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span v-else>💾</span>
          {{ isSaving ? 'Saving…' : 'Save as App' }}
        </button>

        <NuxtLink
          to="/apps/new"
          class="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Or customize manually →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
