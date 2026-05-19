<script setup lang="ts">
const emit = defineEmits<{ 'want-it': [] }>()
</script>

<template>
  <div class="sticky top-0 z-20 bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-between gap-3">
    <p class="text-sm font-medium">
      ✨ Este es un demo — ¿Quieres este catálogo para tu negocio?
    </p>
    <button
      class="shrink-0 px-3 py-1 bg-white text-indigo-600 text-xs font-bold rounded-full hover:bg-indigo-50 transition-colors"
      @click="emit('want-it')"
    >
      Sí, lo quiero →
    </button>
  </div>
</template>
