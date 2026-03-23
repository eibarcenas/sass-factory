<script setup lang="ts">
import type { AppFeature } from '@sass-factory/core'
import { FEATURE_LABELS } from '@sass-factory/core'

interface Props {
  modelValue: AppFeature[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [features: AppFeature[]]
}>()

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

const featureIcons: Record<AppFeature, string> = {
  hero: '🏠',
  timeline: '📅',
  gallery: '🖼️',
  letter: '💌',
  feed: '📱',
  moments: '✨',
  music: '🎵',
  countdown: '⏱️',
  closing: '🎬',
}

function isEnabled(feature: AppFeature) {
  return props.modelValue.includes(feature)
}

function toggle(feature: AppFeature) {
  if (isEnabled(feature)) {
    emit('update:modelValue', props.modelValue.filter((f) => f !== feature))
  } else {
    emit('update:modelValue', [...props.modelValue, feature])
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-2">
    <button
      v-for="feature in allFeatures"
      :key="feature"
      type="button"
      class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150 text-left"
      :class="
        isEnabled(feature)
          ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      "
      @click="toggle(feature)"
    >
      <span class="text-lg shrink-0">{{ featureIcons[feature] }}</span>
      <span class="text-sm font-medium flex-1">{{ FEATURE_LABELS[feature] }}</span>
      <span
        class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
        :class="
          isEnabled(feature)
            ? 'border-indigo-500 bg-indigo-500 text-white'
            : 'border-gray-300 bg-white'
        "
      >
        <svg
          v-if="isEnabled(feature)"
          class="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    </button>
  </div>
</template>
