<script setup lang="ts">
import type { Business } from '@sass-factory/core'

const emit = defineEmits<{ generated: [business: Business] }>()

const prompt = ref('')
const isGenerating = ref(false)
const streamText = ref('')
const error = ref('')
const generatedBusiness = ref<Business | null>(null)

async function generate() {
  if (!prompt.value.trim()) return
  isGenerating.value = true
  streamText.value = ''
  error.value = ''
  generatedBusiness.value = null

  try {
    const response = await fetch('/api/apps/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.value }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) throw new Error('No response body')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        if (line.startsWith('event: delta')) continue
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          if (data.text) streamText.value += data.text
          if (data.config) {
            generatedBusiness.value = data.config
            emit('generated', data.config)
          }
          if (data.error) throw new Error(data.error)
        }
      }
    }
  } catch (err: any) {
    error.value = err.message ?? 'Error al generar'
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5">
        Describe el negocio
      </label>
      <textarea
        v-model="prompt"
        rows="3"
        placeholder="Heladería en Monterrey llamada El Pingüino, venden helados artesanales y sundaes, ambiente familiar..."
        class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        :disabled="isGenerating"
      />
    </div>

    <button
      class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
      :disabled="isGenerating || !prompt.trim()"
      @click="generate"
    >
      {{ isGenerating ? '✨ Generando...' : '✨ Generar Demo' }}
    </button>

    <!-- Streaming output -->
    <div v-if="isGenerating && streamText" class="bg-gray-50 rounded-xl p-4 text-xs font-mono text-gray-600 max-h-32 overflow-y-auto">
      {{ streamText }}
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <!-- Generated preview -->
    <div v-if="generatedBusiness" class="bg-white border border-green-200 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          :style="{ backgroundColor: generatedBusiness.theme.primary + '20' }"
        >
          {{ generatedBusiness.theme.emoji }}
        </div>
        <div>
          <p class="font-semibold text-gray-900">{{ generatedBusiness.name }}</p>
          <p class="text-sm text-gray-500">{{ generatedBusiness.type }} · {{ generatedBusiness.city }}</p>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-2">{{ generatedBusiness.tagline }}</p>
      <a
        :href="`/demo/${generatedBusiness.slug}`"
        target="_blank"
        class="mt-3 inline-block text-xs text-indigo-600 hover:underline"
      >
        Ver demo → /demo/{{ generatedBusiness.slug }}
      </a>
    </div>
  </div>
</template>
