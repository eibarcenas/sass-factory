<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ currentLogo?: string; uploading?: boolean }>()
const emit = defineEmits<{
  upload: [file: File]
  error: [message: string]
}>()

const isDragging = ref(false)
const preview = ref(props.currentLogo ?? '')

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 2

function handleFile(file: File) {
  if (!ALLOWED.includes(file.type)) {
    emit('error', `Tipo no permitido: ${file.type}. Usa JPEG, PNG o WebP.`)
    return
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    emit('error', `Archivo muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máx ${MAX_MB}MB.`)
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => { preview.value = e.target?.result as string }
  reader.readAsDataURL(file)
  emit('upload', file)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">Logo</label>
    <div
      class="relative border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer"
      :class="isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        class="absolute inset-0 opacity-0 cursor-pointer"
        @change="onInput"
      />
      <div v-if="preview" class="flex justify-center mb-3">
        <img :src="preview" class="w-20 h-20 rounded-xl object-cover" alt="Logo preview" />
      </div>
      <p class="text-sm text-gray-500">
        <span v-if="uploading">Subiendo...</span>
        <span v-else>Arrastra tu logo aquí o haz clic para seleccionar</span>
      </p>
      <p class="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · máx 2MB</p>
    </div>
  </div>
</template>
