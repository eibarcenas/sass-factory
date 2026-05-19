<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Business, BusinessStatus } from '@sass-factory/core'
import { StatusBadge } from '@sass-factory/ui'

const metrics = ref<{ totalBusinesses: number; newThisWeek: number; demosInPipeline: number; mrrEstimate: number; conversionRate: number } | null>(null)
const businesses = ref<Business[]>([])
const loading = ref(true)
const activeFilter = ref<BusinessStatus | ''>('')
const searchQ = ref('')

const STATUS_FILTERS: { label: string; value: BusinessStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Demo', value: 'demo' },
  { label: 'Enviado', value: 'sent' },
  { label: 'Activos', value: 'active' },
  { label: 'Suspendidos', value: 'suspended' },
]

async function fetchData() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (activeFilter.value) params.set('status', activeFilter.value)
    if (searchQ.value) params.set('q', searchQ.value)
    const [m, b] = await Promise.all([
      $fetch<typeof metrics.value>('/api/superadmin/metrics'),
      $fetch<{ businesses: Business[] }>(`/api/superadmin/businesses?${params}`),
    ])
    metrics.value = m
    businesses.value = b.businesses
  } finally {
    loading.value = false
  }
}

async function suspend(id: string) {
  await $fetch(`/api/admin/businesses/${id}/suspend`, { method: 'POST' })
  await fetchData()
}

async function reactivate(id: string) {
  await $fetch(`/api/admin/businesses/${id}/activate`, { method: 'POST' })
  await fetchData()
}

watch([activeFilter, searchQ], fetchData)
onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <h1 class="text-xl font-bold text-gray-900">Super Admin — catalog.mx</h1>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <!-- Metrics -->
      <div v-if="metrics" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ metrics.totalBusinesses.toLocaleString() }}</p>
          <p class="text-xs text-gray-500 mt-1">Total negocios</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-green-600">+{{ metrics.newThisWeek }}</p>
          <p class="text-xs text-gray-500 mt-1">Nuevos esta semana</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-indigo-600">{{ metrics.demosInPipeline }}</p>
          <p class="text-xs text-gray-500 mt-1">Demos en pipeline</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">${{ metrics.mrrEstimate.toLocaleString() }}</p>
          <p class="text-xs text-gray-500 mt-1">MRR estimado (MXN)</p>
        </div>
      </div>

      <!-- Conversion funnel -->
      <div v-if="metrics" class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-semibold text-gray-700 mb-3">Conversión demos → activos</p>
        <div class="flex items-center gap-3">
          <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div class="h-full bg-indigo-600 rounded-full transition-all" :style="{ width: `${metrics.conversionRate}%` }" />
          </div>
          <span class="text-sm font-bold text-gray-900">{{ metrics.conversionRate }}%</span>
        </div>
      </div>

      <!-- Filters + Search -->
      <div class="flex flex-wrap gap-3 items-center">
        <div class="flex gap-2">
          <button
            v-for="f in STATUS_FILTERS"
            :key="f.value"
            class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
            :class="activeFilter === f.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
            @click="activeFilter = f.value"
          >
            {{ f.label }}
          </button>
        </div>
        <input
          v-model="searchQ"
          type="text"
          placeholder="Buscar negocio..."
          class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <!-- Business list -->
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="border-b border-gray-100 bg-gray-50">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Negocio</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in businesses"
              :key="b.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{ b.theme.emoji }}</span>
                  <div>
                    <p class="font-medium text-gray-900">{{ b.name }}</p>
                    <p class="text-xs text-gray-400">{{ b.city }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600 capitalize">{{ b.type }}</td>
              <td class="px-4 py-3">
                <StatusBadge :status="b.status" />
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="b.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' : b.plan === 'growth' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ b.plan }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2 justify-end">
                  <button
                    v-if="b.status === 'active'"
                    class="text-xs px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    @click="suspend(b.id)"
                  >
                    Suspender
                  </button>
                  <button
                    v-else-if="b.status === 'suspended'"
                    class="text-xs px-2.5 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    @click="reactivate(b.id)"
                  >
                    Reactivar
                  </button>
                  <a
                    :href="`/demo/${b.slug}`"
                    target="_blank"
                    class="text-xs text-indigo-600 hover:underline"
                  >
                    Ver →
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!businesses.length && !loading" class="text-center py-10 text-gray-400">
          <p class="text-3xl mb-2">📋</p>
          <p class="text-sm">Sin resultados</p>
        </div>
      </div>
    </main>
  </div>
</template>
