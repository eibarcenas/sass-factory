<script setup lang="ts">
defineProps<{ modelValue: string; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const COLOR_PRESETS = [
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#1f2937', '#7c3aed', '#db2777',
]
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>
    <div class="flex items-center gap-3 mb-3">
      <div
        class="w-10 h-10 rounded-xl border-2 border-white shadow-md cursor-pointer relative overflow-hidden"
        :style="{ backgroundColor: modelValue }"
      >
        <input
          type="color"
          :value="modelValue"
          class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <input
        :value="modelValue"
        type="text"
        placeholder="#06b6d4"
        class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="grid grid-cols-6 gap-2">
      <button
        v-for="color in COLOR_PRESETS"
        :key="color"
        class="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
        :style="{ backgroundColor: color }"
        :class="modelValue === color ? 'border-gray-900 shadow-md' : 'border-transparent'"
        @click="emit('update:modelValue', color)"
      />
    </div>
  </div>
</template>
