<script setup lang="ts">
import type { Item } from '@sass-factory/core'
import ProductCard from './ProductCard.vue'

defineProps<{ items: Item[]; primaryColor?: string }>()
const emit = defineEmits<{ select: [item: Item] }>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <ProductCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :primary-color="primaryColor"
      @select="emit('select', $event)"
    />
  </div>
  <div v-if="items.length === 0" class="col-span-2 text-center py-12 text-gray-400">
    <p class="text-4xl mb-2">📦</p>
    <p class="text-sm">No hay productos en esta categoría</p>
  </div>
</template>
