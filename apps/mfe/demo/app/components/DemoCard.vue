<script setup lang="ts">
import type { Business } from '@sass-factory/core'
import { StatusBadge } from '@sass-factory/ui'

const props = defineProps<{ business: Business }>()
const emit = defineEmits<{
  publish: [id: string]
  send: [id: string]
  activate: [id: string]
  suspend: [id: string]
}>()

const actionMap: Record<string, { label: string; event: string; color: string }> = {
  draft:    { label: 'Publicar demo', event: 'publish', color: 'bg-blue-600' },
  demo:     { label: 'Marcar enviado', event: 'send', color: 'bg-yellow-600' },
  accepted: { label: 'Activar', event: 'activate', color: 'bg-green-600' },
  active:   { label: 'Suspender', event: 'suspend', color: 'bg-red-600' },
}

const action = computed(() => actionMap[props.business.status])
</script>

<template>
  <div class="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          :style="{ backgroundColor: business.theme.primary + '20' }"
        >
          {{ business.theme.emoji }}
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-gray-900 text-sm truncate">{{ business.name }}</p>
          <p class="text-xs text-gray-500">{{ business.type }} · {{ business.city }}</p>
        </div>
      </div>
      <StatusBadge :status="business.status" />
    </div>

    <div v-if="business.tagline" class="mt-2 text-xs text-gray-400 line-clamp-1">
      {{ business.tagline }}
    </div>

    <div class="mt-3 flex items-center gap-2">
      <a
        :href="`/demo/${business.slug}`"
        target="_blank"
        class="text-xs text-indigo-600 hover:underline"
      >
        Ver demo →
      </a>
      <span class="text-gray-200">|</span>
      <button
        v-if="action"
        class="text-xs font-medium text-white px-2.5 py-1 rounded-lg transition-colors"
        :class="action.color"
        @click="emit(action.event as any, business.id)"
      >
        {{ action.label }}
      </button>
    </div>
  </div>
</template>
