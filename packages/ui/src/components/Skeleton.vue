<script setup lang="ts">
defineProps<{ variant?: 'text' | 'card' | 'image'; width?: string; height?: string }>()
</script>

<template>
  <div
    class="animate-pulse bg-gray-200 rounded"
    :class="{
      'h-4 rounded': variant === 'text' || !variant,
      'h-32 rounded-2xl': variant === 'card',
      'h-48 rounded-xl': variant === 'image',
    }"
    :style="{ width: width ?? '100%', height: height }"
  />
</template>
