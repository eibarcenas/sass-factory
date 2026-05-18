<script setup lang="ts">
import type { BusinessType, BusinessTheme } from '@sass-factory/core'
import { useApps } from '~/composables/useApps'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'default' })

const { createApp } = useApps()
const toast = useToast()
const router = useRouter()

const isSubmitting = ref(false)

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

const form = reactive({
  name: '',
  slug: '',
  type: '' as BusinessType | '',
  whatsapp: '',
  city: '',
  tagline: '',
  theme: {
    primary: '#6366f1',
    secondary: '#a5b4fc',
    accent: '#f59e0b',
    background: '#ffffff',
    font: 'Inter',
    emoji: '🏪',
    gradient: ['#6366f1', '#8b5cf6'] as [string, string],
  } as BusinessTheme,
})

watch(
  () => form.name,
  (val) => {
    if (val && !form.slug) {
      form.slug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 40)
    }
  },
)

function selectType(type: BusinessType) {
  const found = BUSINESS_TYPES.find((b) => b.key === type)
  form.type = type
  if (found) form.theme.emoji = found.emoji
}

const canSubmit = computed(
  () => !!(form.name && form.slug && form.type && form.whatsapp && form.city),
)

async function handleSubmit() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  try {
    await createApp({
      name: form.name,
      slug: form.slug,
      type: form.type as BusinessType,
      whatsapp: form.whatsapp,
      city: form.city,
      tagline: form.tagline,
      theme: form.theme,
      status: 'draft',
      plan: 'free',
    })
    toast.success('Negocio creado correctamente')
    router.push('/')
  } catch {
    toast.error('Error al crear el negocio. Intenta de nuevo.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <NuxtLink to="/" class="hover:text-gray-700 transition-colors">Dashboard</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 font-medium">Nuevo negocio</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Crear negocio manualmente</h1>
      <p class="text-gray-500 mt-1">
        O usa
        <NuxtLink to="/apps/generate" class="text-indigo-600 hover:underline">
          el generador AI
        </NuxtLink>
        para crear un demo completo en segundos.
      </p>
    </div>

    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      <!-- Business type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Tipo de negocio <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="bt in BUSINESS_TYPES"
            :key="bt.key"
            type="button"
            class="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center"
            :class="
              form.type === bt.key
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            "
            @click="selectType(bt.key)"
          >
            <span class="text-2xl">{{ bt.emoji }}</span>
            <span class="text-xs font-medium text-gray-700">{{ bt.label }}</span>
          </button>
        </div>
      </div>

      <!-- Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          Nombre del negocio <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Ej. Heladería El Pingüino"
          class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <!-- Slug -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          URL <span class="text-red-500">*</span>
        </label>
        <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
          <span class="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 shrink-0">
            catalog.mx/
          </span>
          <input
            v-model="form.slug"
            type="text"
            placeholder="heladeria-pinguino"
            class="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
          />
        </div>
      </div>

      <!-- WhatsApp + City -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            WhatsApp <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.whatsapp"
            type="tel"
            placeholder="+521234567890"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Ciudad <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.city"
            type="text"
            placeholder="Monterrey"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <!-- Tagline -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
        <input
          v-model="form.tagline"
          type="text"
          placeholder="La mejor heladería artesanal de Monterrey"
          class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>

    <div class="flex justify-end mt-6 gap-3">
      <NuxtLink
        to="/"
        class="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
      >
        Cancelar
      </NuxtLink>
      <button
        type="button"
        class="px-6 py-2.5 text-sm font-medium text-white rounded-xl transition-colors"
        :class="canSubmit && !isSubmitting ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-200 cursor-not-allowed'"
        :disabled="!canSubmit || isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? 'Creando...' : 'Crear negocio' }}
      </button>
    </div>
  </div>
</template>
