<script setup lang="ts">
import type { Item } from '@sass-factory/core'
import { PriceDisplay } from '@sass-factory/ui'
defineProps<{ item: Item; primaryColor?: string }>()
const emit = defineEmits<{ select: [item: Item] }>()
</script>

<template>
  <button
    class="w-full text-left bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-95"
    @click="emit('select', item)"
  >
    <div class="aspect-square bg-gray-100 relative overflow-hidden">
      <img
        v-if="item.image"
        :src="item.image"
        :alt="item.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-4xl"
        :style="{ backgroundColor: primaryColor ?? '#f3f4f6' }"
      >
        🛍️
      </div>
    </div>
    <div class="p-3">
      <p class="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{{ item.name }}</p>
      <PriceDisplay :price="item.price" currency="MXN" size="sm" class="mt-1" />
    </div>
  </button>
</template>
