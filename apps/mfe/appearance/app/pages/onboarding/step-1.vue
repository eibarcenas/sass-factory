<script setup lang="ts">
import type { BusinessTheme } from '@sass-factory/core'
import ColorPicker from '~/components/ColorPicker.vue'
import LogoUpload from '~/components/LogoUpload.vue'

const theme = ref<Partial<BusinessTheme>>({ primary: '#06b6d4', font: 'Inter' })
const tagline = ref('')
const loading = ref(false)
const uploadError = ref('')

const FONTS = ['Inter', 'Quicksand', 'Nunito', 'Poppins', 'Playfair Display', 'Lora', 'Oswald', 'Raleway']

async function handleLogoUpload(file: File) {
  loading.value = true
  uploadError.value = ''
  const form = new FormData()
  form.append('logo', file)
  try {
    await $fetch('/api/owner/logo', { method: 'POST', body: form })
  } catch (err: any) {
    uploadError.value = err.message ?? 'Error al subir logo'
  } finally {
    loading.value = false
  }
}

async function continuar() {
  loading.value = true
  try {
    await $fetch('/api/owner/business', {
      method: 'PATCH',
      body: { theme: theme.value, tagline: tagline.value },
    })
    await navigateTo('/owner/onboarding/step-2')
  } catch { /* ignore */ }
  finally { loading.value = false }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <div class="mb-6">
      <div class="flex gap-1 mb-4">
        <div class="h-1 flex-1 rounded-full bg-indigo-600" />
        <div class="h-1 flex-1 rounded-full bg-gray-200" />
        <div class="h-1 flex-1 rounded-full bg-gray-200" />
      </div>
      <h1 class="text-xl font-bold text-gray-900">Personaliza tu tienda</h1>
      <p class="text-sm text-gray-500 mt-1">Elige colores y tipografía que representen tu negocio.</p>
    </div>

    <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <ColorPicker
        label="Color principal"
        :model-value="theme.primary ?? '#6366f1'"
        @update:model-value="theme.primary = $event"
      />

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Tipografía</label>
        <select
          v-model="theme.font"
          class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option v-for="f in FONTS" :key="f" :value="f">{{ f }}</option>
        </select>
      </div>

      <LogoUpload :uploading="loading" @upload="handleLogoUpload" @error="uploadError = $event" />

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          Frase del negocio
          <span class="text-gray-400 font-normal">({{ tagline.length }}/120)</span>
        </label>
        <input
          v-model="tagline"
          maxlength="120"
          type="text"
          placeholder="La mejor heladería de Monterrey 🍦"
          class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <p v-if="uploadError" class="text-sm text-red-600">{{ uploadError }}</p>

      <button
        class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
        :disabled="loading"
        @click="continuar"
      >
        {{ loading ? 'Guardando...' : 'Continuar →' }}
      </button>
    </div>
  </div>
</template>
