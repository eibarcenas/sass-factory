<script setup lang="ts">
import { useAppConfig } from '~/composables/useAppConfig'
import { useTheme } from '~/composables/useTheme'

const route = useRoute()
const { appConfig, isLoading, loadBySlug } = useAppConfig()
const { applyTheme } = useTheme()

const slug = computed(() => {
  const parts = route.params.slug as string[]
  return Array.isArray(parts) ? parts[0] : parts
})

watch(
  () => appConfig.value?.theme,
  (theme) => {
    if (theme) applyTheme(theme)
  },
  { immediate: true },
)

// Load app by the route slug if not yet loaded
onMounted(async () => {
  if (!appConfig.value && slug.value) {
    await loadBySlug(slug.value)
  }
})
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center"
    :style="{ backgroundColor: appConfig?.theme?.background ?? '#fff' }"
  >
    <div v-if="isLoading" class="text-center">
      <p class="text-gray-400 text-sm">Loading...</p>
    </div>

    <div v-else-if="appConfig" class="text-center max-w-lg mx-auto px-6 py-20">
      <p class="text-6xl mb-6">{{ appConfig.theme?.emoji ?? '✨' }}</p>
      <h1
        class="text-4xl font-bold mb-4"
        :style="{ color: appConfig.theme?.primary ?? '#e11d48', fontFamily: `'${appConfig.theme?.font ?? 'serif'}', serif` }"
      >
        {{ appConfig.name }}
      </h1>
      <p class="text-gray-500 mb-8">{{ appConfig.metadata?.description }}</p>
      <NuxtLink
        to="/"
        class="px-6 py-3 rounded-2xl text-white font-medium"
        :style="{ backgroundColor: appConfig.theme?.primary ?? '#e11d48' }"
      >
        Go Home
      </NuxtLink>
    </div>

    <div v-else class="text-center">
      <p class="text-5xl mb-4">😕</p>
      <h1 class="text-xl font-semibold text-gray-900 mb-2">Not Found</h1>
      <NuxtLink to="/" class="text-sm text-indigo-600 hover:underline">Go back home</NuxtLink>
    </div>
  </div>
</template>
