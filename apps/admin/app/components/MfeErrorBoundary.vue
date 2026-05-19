<script setup lang="ts">
const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err.message
  return false
})
</script>

<template>
  <div v-if="hasError" class="flex flex-col items-center justify-center py-20 text-center">
    <p class="text-4xl mb-3">⚠️</p>
    <h2 class="font-semibold text-gray-900">Error al cargar módulo</h2>
    <p class="text-sm text-gray-500 mt-1">{{ errorMessage }}</p>
    <button
      class="mt-4 text-sm text-indigo-600 hover:underline"
      @click="hasError = false"
    >
      Reintentar
    </button>
  </div>
  <slot v-else />
</template>
