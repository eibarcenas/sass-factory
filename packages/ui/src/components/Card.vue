<script setup lang="ts">
const props = withDefaults(defineProps<{ padding?: boolean }>(), { padding: true })
</script>

<template>
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-gray-100">
      <slot name="header" />
    </div>
    <div :class="props.padding ? 'p-6' : ''">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100 bg-gray-50">
      <slot name="footer" />
    </div>
  </div>
</template>
