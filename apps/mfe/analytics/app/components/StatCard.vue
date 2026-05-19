<script setup lang="ts">
defineProps<{ label: string; value: string | number; trend?: string; trendUp?: boolean }>()
</script>

<template>
  <div class="bg-white rounded-2xl border border-gray-200 p-5">
    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ label }}</p>
    <p class="text-3xl font-bold text-gray-900 mt-1">{{ value.toLocaleString('es-MX') }}</p>
    <p v-if="trend" class="text-xs mt-2" :class="trendUp ? 'text-green-600' : 'text-red-500'">
      {{ trendUp ? '↑' : '↓' }} {{ trend }}
    </p>
  </div>
</template>
