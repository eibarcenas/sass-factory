<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { Business, BusinessType } from '@sass-factory/core'

const emit = defineEmits<{ generated: [business: Business] }>()

const BUSINESS_TYPES: { key: BusinessType; label: string; emoji: string }[] = [
  { key: 'heladeria', label: 'Heladería', emoji: '🍦' },
  { key: 'barberia', label: 'Barbería', emoji: '💈' },
  { key: 'estetica', label: 'Estética', emoji: '💅' },
  { key: 'restaurante', label: 'Restaurante', emoji: '🍽️' },
  { key: 'panaderia', label: 'Panadería', emoji: '🥐' },
  { key: 'gym', label: 'Gym', emoji: '💪' },
  { key: 'mecanico', label: 'Mecánico', emoji: '🔧' },
  { key: 'otro', label: 'Otro', emoji: '🏪' },
]

// ── Manual form (default, always works) ──────────────────────────────
const form = reactive({ name: '', type: '' as BusinessType | '', whatsapp: '', city: '', tagline: '' })
const submitting = ref(false)
const manualError = ref('')

async function createManual() {
  if (!form.name || !form.type || !form.whatsapp || !form.city) {
    manualError.value = 'Nombre, tipo, WhatsApp y ciudad son requeridos'
    return
  }
  submitting.value = true
  manualError.value = ''
  try {
    const business = await $fetch<Business>('/api/admin/demos', {
      method: 'POST',
      body: { ...form },
    })
    emit('generated', business)
    Object.assign(form, { name: '', type: '', whatsapp: '', city: '', tagline: '' })
  } catch (err: any) {
    manualError.value = err.data?.message ?? 'Error al crear demo'
  } finally {
    submitting.value = false
  }
}

// ── AI generation (optional) ─────────────────────────────────────────
const aiPrompt = ref('')
const aiGenerating = ref(false)
const aiStreamText = ref('')
const aiError = ref('')
const aiAvailable = ref(true) // turns false on first 503

async function generateWithAI() {
  if (!aiPrompt.value.trim()) return
  aiGenerating.value = true
  aiStreamText.value = ''
  aiError.value = ''
  try {
    const response = await fetch('/api/apps/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: aiPrompt.value }),
    })
    if (response.status === 503) {
      aiAvailable.value = false
      aiError.value = 'IA no disponible — usa el formulario de arriba'
      return
    }
    if (!response.ok) throw new Error('Error en generación')

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n').filter(Boolean)) {
        if (!line.startsWith('data: ')) continue
        const data = JSON.parse(line.slice(6))
        if (data.text) aiStreamText.value += data.text
        if (data.config) emit('generated', data.config)
        if (data.error) throw new Error(data.error)
      }
    }
  } catch (err: any) {
    aiError.value = err.message ?? 'Error al generar'
  } finally {
    aiGenerating.value = false
  }
}
</script>

<template>
  <div class="space-y-5">

    <!-- Manual form — siempre disponible, camino por defecto -->
    <div class="space-y-3">
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="bt in BUSINESS_TYPES" :key="bt.key"
          class="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all"
          :class="form.type === bt.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'"
          @click="form.type = bt.key"
        >
          <span class="text-xl">{{ bt.emoji }}</span>
          <span class="text-xs font-medium text-gray-700">{{ bt.label }}</span>
        </button>
      </div>

      <input v-model="form.name" type="text" placeholder="Nombre del negocio *"
        class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />

      <div class="grid grid-cols-2 gap-3">
        <input v-model="form.whatsapp" type="tel" placeholder="+52... WhatsApp *"
          class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input v-model="form.city" type="text" placeholder="Ciudad *"
          class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <input v-model="form.tagline" type="text" placeholder="Frase del negocio (opcional)"
        class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />

      <p v-if="manualError" class="text-xs text-red-600">{{ manualError }}</p>

      <button
        class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        :disabled="submitting" @click="createManual"
      >
        {{ submitting ? 'Creando...' : 'Crear demo' }}
      </button>
    </div>

    <!-- AI generation — opcional, se oculta si no está disponible -->
    <div v-if="aiAvailable" class="border-t border-gray-100 pt-4 space-y-2">
      <p class="text-xs text-gray-400 flex items-center gap-1">
        <span>✨</span> Opción: generar con IA
      </p>
      <textarea v-model="aiPrompt" rows="2"
        placeholder="Describe el negocio y la IA lo configura..."
        class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        :disabled="aiGenerating" />
      <button
        class="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium rounded-xl disabled:opacity-40"
        :disabled="aiGenerating || !aiPrompt.trim()" @click="generateWithAI"
      >
        {{ aiGenerating ? '✨ Generando...' : '✨ Generar con IA' }}
      </button>
      <p v-if="aiError" class="text-xs text-amber-600">{{ aiError }}</p>
    </div>

  </div>
</template>
