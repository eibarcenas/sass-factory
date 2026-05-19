<script setup lang="ts">
const props = defineProps<{
  price: number
  currency: 'MXN'
  originalPrice?: number
  size?: 'sm' | 'md' | 'lg'
}>()

const formatted = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: props.currency, minimumFractionDigits: 0 }).format(n)

const sizeClass = { sm: 'text-sm', md: 'text-base', lg: 'text-xl font-bold' }
</script>

<template>
  <span class="inline-flex items-baseline gap-2">
    <span :class="sizeClass[size ?? 'md']" class="font-semibold text-gray-900">
      {{ formatted(price) }}
    </span>
    <span v-if="originalPrice" data-testid="original-price" class="text-sm text-gray-400 line-through">
      {{ formatted(originalPrice) }}
    </span>
  </span>
</template>
