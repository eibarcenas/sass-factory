<script setup lang="ts">
defineProps<{
  variant?: 'neutral' | 'info' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
}>()

const variantClasses = {
  neutral: 'bg-gray-100 text-gray-700',
  info:    'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error:   'bg-red-100 text-red-700',
}
</script>

<template>
  <span
    class="inline-flex items-center font-medium rounded-full"
    :class="[variantClasses[variant ?? 'neutral'], size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs']"
  >
    <slot />
  </span>
</template>
