<script setup lang="ts">
import { doc, getDoc } from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import type { Business, BusinessTheme, BusinessType } from '@sass-factory/core'
import { COLLECTIONS } from '@sass-factory/core'
import { useApps } from '~/composables/useApps'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const db = useFirestore()
const { updateApp } = useApps()
const toast = useToast()

const appId = computed(() => route.params.id as string)
const isLoading = ref(true)
const isSaving = ref(false)

const form = reactive<Partial<Business>>({
  type: 'otro',
  name: '',
  slug: '',
  status: 'draft',
  theme: {} as BusinessTheme,
  whatsapp: '',
  city: '',
  plan: 'free',
})

onMounted(async () => {
  try {
    const docRef = doc(db, COLLECTIONS.APPS, appId.value)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      const data = snap.data() as Business
      Object.assign(form, data)
    } else {
      toast.error('App not found')
      router.push('/')
    }
  } catch (e) {
    toast.error('Failed to load app')
  } finally {
    isLoading.value = false
  }
})

const businessTypes: { value: BusinessType; icon: string; label: string }[] = [
  { value: 'heladeria', icon: '🍦', label: 'Heladería' },
  { value: 'barberia', icon: '✂️', label: 'Barbería' },
  { value: 'estetica', icon: '💅', label: 'Estética' },
  { value: 'restaurante', icon: '🍽️', label: 'Restaurante' },
  { value: 'panaderia', icon: '🥖', label: 'Panadería' },
  { value: 'gym', icon: '💪', label: 'Gym' },
  { value: 'mecanico', icon: '🔧', label: 'Mecánico' },
  { value: 'otro', icon: '🏢', label: 'Otro' },
]

async function handleSave() {
  isSaving.value = true
  try {
    await updateApp(appId.value, {
      type: form.type,
      name: form.name,
      slug: form.slug,
      status: form.status,
      theme: form.theme,
      whatsapp: form.whatsapp,
      city: form.city,
      tagline: form.tagline,
      domain: form.domain,
      plan: form.plan,
    })
    toast.success('App updated successfully!')
  } catch (e) {
    toast.error('Failed to save changes')
  } finally {
    isSaving.value = false
  }
}

</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
      <NuxtLink to="/" class="hover:text-gray-700 transition-colors">Dashboard</NuxtLink>
      <span>/</span>
      <span class="text-gray-900 font-medium">{{ form.name || 'Edit App' }}</span>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-4">
      <div class="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
      <div class="bg-white rounded-2xl border border-gray-200 h-64 animate-pulse" />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-start justify-between mb-8">
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
            :style="{
              background: `linear-gradient(135deg, ${form.theme?.gradient?.[0] ?? '#e2e8f0'}, ${form.theme?.gradient?.[1] ?? '#cbd5e1'})`,
            }"
          >
            {{ form.theme?.emoji ?? '🏢' }}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ form.name }}</h1>
            <p class="text-sm text-gray-400 font-mono">/{{ form.slug }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <NuxtLink
            :to="`/apps/${appId}/analytics`"
            class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Analytics
          </NuxtLink>
          <button
            class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors"
            :class="isSaving ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'"
            :disabled="isSaving"
            @click="handleSave"
          >
            <svg v-if="isSaving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div class="space-y-6">
        <!-- Basic Info -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-5">Basic Information</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">App Name</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
              <input
                v-model="form.slug"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Business Type</label>
              <select
                v-model="form.type"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option
                  v-for="bt in businessTypes"
                  :key="bt.value"
                  :value="bt.value"
                >
                  {{ bt.icon }} {{ bt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                v-model="form.status"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="draft">Draft</option>
                <option value="demo">Demo</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
              <input
                v-model="form.whatsapp"
                type="text"
                placeholder="+52 81 0000 0000"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input
                v-model="form.city"
                type="text"
                placeholder="Monterrey"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Domain <span class="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                v-model="form.domain"
                type="text"
                placeholder="mi-negocio.example.com"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <!-- Theme -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-5">Theme</h2>

          <!-- Preview -->
          <div
            class="h-24 rounded-xl mb-5 flex items-center justify-center text-4xl"
            :style="{
              background: `linear-gradient(135deg, ${form.theme?.gradient?.[0] ?? '#e2e8f0'}, ${form.theme?.gradient?.[1] ?? '#cbd5e1'})`,
            }"
          >
            {{ form.theme?.emoji ?? '🏢' }}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="field in [
                { key: 'primary', label: 'Primary' },
                { key: 'secondary', label: 'Secondary' },
                { key: 'accent', label: 'Accent' },
                { key: 'background', label: 'Background' },
              ]"
              :key="field.key"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div class="relative shrink-0">
                <div
                  class="w-9 h-9 rounded-lg shadow-sm border-2 border-white overflow-hidden"
                  :style="{ backgroundColor: (form.theme as any)?.[field.key] || '#ffffff' }"
                >
                  <input
                    type="color"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    :value="(form.theme as any)?.[field.key] || '#ffffff'"
                    @input="(form.theme as any)[field.key] = ($event.target as HTMLInputElement).value"
                  />
                </div>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium text-gray-700">{{ field.label }}</p>
                <p class="text-xs text-gray-400 font-mono truncate">
                  {{ (form.theme as any)?.[field.key] || '—' }}
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Font</label>
              <select
                v-if="form.theme"
                v-model="form.theme.font"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option
                  v-for="f in ['Playfair Display','Cinzel','Lora','Merriweather','Nunito','Mountains of Christmas','Inter','Poppins']"
                  :key="f"
                  :value="f"
                >
                  {{ f }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Emoji</label>
              <input
                v-if="form.theme"
                v-model="form.theme.emoji"
                type="text"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <!-- Tagline -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-5">Tagline</h2>
          <input
            v-model="form.tagline"
            type="text"
            placeholder="El mejor helado de la ciudad"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </template>
  </div>
</template>
