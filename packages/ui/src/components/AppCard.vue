<script setup lang="ts">
import type { AppConfig } from '@sass-factory/core'

interface Props {
  app: AppConfig
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
  view: [id: string]
}>()

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
}

const featureCount = computed(() => props.app.features?.length ?? 0)

const formattedDate = computed(() => {
  if (!props.app.createdAt) return '—'
  return new Date(props.app.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})
</script>

<template>
  <div
    class="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
  >
    <!-- Gradient header -->
    <div
      class="h-24 w-full flex items-center justify-center text-5xl relative"
      :style="{
        background: `linear-gradient(135deg, ${app.theme?.gradient?.[0] ?? '#e2e8f0'}, ${app.theme?.gradient?.[1] ?? '#cbd5e1'})`,
      }"
    >
      <span class="drop-shadow-sm">{{ app.theme?.emoji ?? '✨' }}</span>
      <!-- Status badge -->
      <span
        class="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full border"
        :class="statusColors[app.status] ?? statusColors.draft"
      >
        {{ statusLabels[app.status] ?? app.status }}
      </span>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 text-base truncate">{{ app.name }}</h3>
      <p class="text-sm text-gray-500 mt-0.5 truncate">{{ app.slug }}</p>

      <div class="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span class="flex items-center gap-1">
          <span class="i-heroicons-puzzle-piece w-3.5 h-3.5" />
          {{ featureCount }} features
        </span>
        <span class="flex items-center gap-1">
          <span class="i-heroicons-calendar w-3.5 h-3.5" />
          {{ formattedDate }}
        </span>
      </div>

      <!-- Color swatches -->
      <div class="flex gap-1.5 mt-3">
        <div
          class="w-5 h-5 rounded-full border-2 border-white shadow-sm"
          :style="{ backgroundColor: app.theme?.primary }"
          title="Primary"
        />
        <div
          class="w-5 h-5 rounded-full border-2 border-white shadow-sm"
          :style="{ backgroundColor: app.theme?.secondary }"
          title="Secondary"
        />
        <div
          class="w-5 h-5 rounded-full border-2 border-white shadow-sm"
          :style="{ backgroundColor: app.theme?.accent }"
          title="Accent"
        />
        <div
          class="w-5 h-5 rounded-full border-2 border-white shadow-sm"
          :style="{ backgroundColor: app.theme?.background }"
          title="Background"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="px-4 pb-4 flex gap-2">
      <button
        class="flex-1 text-xs font-medium py-1.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
        @click="emit('view', app.id)"
      >
        View
      </button>
      <button
        class="flex-1 text-xs font-medium py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
        @click="emit('edit', app.id)"
      >
        Edit
      </button>
      <button
        class="text-xs font-medium py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
        @click="emit('delete', app.id)"
      >
        <span class="i-heroicons-trash w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
