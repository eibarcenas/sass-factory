<script setup lang="ts">
import type { AppTheme } from '@sass-factory/core'

interface Props {
  modelValue: Partial<AppTheme>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [theme: Partial<AppTheme>]
}>()

const theme = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function updateColor(key: keyof AppTheme, value: string) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const colorFields: { key: keyof AppTheme; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
]

const fontOptions = [
  'Playfair Display',
  'Cinzel',
  'Lora',
  'Merriweather',
  'Nunito',
  'Mountains of Christmas',
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
]
</script>

<template>
  <div class="space-y-5">
    <!-- Color pickers -->
    <div>
      <h4 class="text-sm font-semibold text-gray-700 mb-3">Colors</h4>
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="field in colorFields"
          :key="field.key"
          class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
        >
          <div class="relative">
            <div
              class="w-10 h-10 rounded-lg shadow-sm border-2 border-white cursor-pointer overflow-hidden"
              :style="{ backgroundColor: (theme[field.key] as string) || '#ffffff' }"
            >
              <input
                type="color"
                class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                :value="(theme[field.key] as string) || '#ffffff'"
                @input="updateColor(field.key, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-gray-700">{{ field.label }}</p>
            <p class="text-xs text-gray-400 font-mono truncate">
              {{ (theme[field.key] as string) || '—' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Font picker -->
    <div>
      <h4 class="text-sm font-semibold text-gray-700 mb-3">Font</h4>
      <select
        class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        :value="theme.font"
        @change="updateColor('font', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Select a font...</option>
        <option
          v-for="font in fontOptions"
          :key="font"
          :value="font"
          :style="{ fontFamily: font }"
        >
          {{ font }}
        </option>
      </select>
    </div>

    <!-- Gradient preview -->
    <div v-if="theme.gradient?.length">
      <h4 class="text-sm font-semibold text-gray-700 mb-3">Gradient Preview</h4>
      <div
        class="h-16 rounded-xl shadow-sm"
        :style="{
          background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
        }"
      />
    </div>
  </div>
</template>
