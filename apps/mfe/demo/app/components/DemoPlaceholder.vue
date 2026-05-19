<script setup lang="ts">
// This will become the AI demo generation UI in Sprint 4
defineProps<{ message?: string }>()
</script>

<template>
  <div class="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
    <p class="text-sm">{{ message ?? 'Demo MFE — Sprint 4' }}</p>
  </div>
</template>
