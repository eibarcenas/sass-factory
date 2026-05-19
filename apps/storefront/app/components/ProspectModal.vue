<script setup lang="ts">
const props = defineProps<{ businessId: string }>()
const emit = defineEmits<{ close: []; submitted: [] }>()

const form = reactive({ contactName: '', phone: '', email: '' })
const loading = ref(false)
const submitted = ref(false)
const error = ref('')

async function submit() {
  if (!form.phone && !form.email) {
    error.value = 'Ingresa tu teléfono o email'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/prospects', {
      method: 'POST',
      body: { businessId: props.businessId, ...form },
    })
    submitted.value = true
    emit('submitted')
  } catch {
    error.value = 'Error al enviar. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="emit('close')">
      <div class="fixed inset-0 bg-black/40" @click="emit('close')" />
      <div class="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-xl">
        <template v-if="!submitted">
          <h2 class="font-bold text-gray-900 text-lg mb-1">¡Perfecto! Cuéntanos sobre ti</h2>
          <p class="text-sm text-gray-500 mb-4">Te contactaremos en menos de 24 horas.</p>

          <div class="space-y-3">
            <input v-model="form.contactName" type="text" placeholder="Tu nombre" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input v-model="form.phone" type="tel" placeholder="WhatsApp o teléfono *" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input v-model="form.email" type="email" placeholder="Email (opcional)" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <p v-if="error" class="mt-2 text-xs text-red-600">{{ error }}</p>

          <button
            class="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            :disabled="loading"
            @click="submit"
          >
            {{ loading ? 'Enviando...' : 'Quiero mi catálogo real →' }}
          </button>
        </template>
        <template v-else>
          <div class="text-center py-4">
            <div class="text-5xl mb-3">🎉</div>
            <h2 class="font-bold text-gray-900 text-lg">¡Recibido!</h2>
            <p class="text-sm text-gray-500 mt-1">Te contactaremos muy pronto.</p>
            <button class="mt-4 text-sm text-indigo-600 hover:underline" @click="emit('close')">Cerrar</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
