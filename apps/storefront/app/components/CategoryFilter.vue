<script setup lang="ts">
const props = defineProps<{ categories: string[]; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()
</script>

<template>
  <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    <button
      class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
      :class="modelValue === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      @click="emit('update:modelValue', '')"
    >
      Todos
    </button>
    <button
      v-for="cat in categories"
      :key="cat"
      class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
      :class="modelValue === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      @click="emit('update:modelValue', cat)"
    >
      {{ cat }}
    </button>
  </div>
</template>
