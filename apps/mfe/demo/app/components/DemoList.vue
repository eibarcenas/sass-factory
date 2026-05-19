<script setup lang="ts">
import type { Business, BusinessStatus } from '@sass-factory/core'
import DemoCard from './DemoCard.vue'

const activeFilter = ref<BusinessStatus | ''>('')
const businesses = ref<Business[]>([])
const loading = ref(false)

const statusFilters: { label: string; value: BusinessStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Demo', value: 'demo' },
  { label: 'Enviados', value: 'sent' },
  { label: 'Aceptados', value: 'accepted' },
  { label: 'Activos', value: 'active' },
]

async function fetchBusinesses() {
  loading.value = true
  try {
    const params = activeFilter.value ? `?status=${activeFilter.value}` : ''
    const data = await $fetch<{ businesses: Business[] }>(`/api/admin/businesses${params}`)
    businesses.value = data.businesses
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(activeFilter, fetchBusinesses, { immediate: true })

async function handleAction(action: string, id: string) {
  try {
    await $fetch(`/api/admin/businesses/${id}/${action}`, { method: 'POST' })
    await fetchBusinesses()
  } catch (e: any) {
    alert(e.message ?? 'Error')
  }
}
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="flex gap-2 flex-wrap mb-4">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
        :class="activeFilter === f.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- List -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 bg-gray-100 rounded-2xl animate-pulse" />
    </div>

    <div v-else-if="businesses.length" class="space-y-3">
      <DemoCard
        v-for="b in businesses"
        :key="b.id"
        :business="b"
        @publish="handleAction('publish', $event)"
        @send="handleAction('send', $event)"
        @activate="handleAction('activate', $event)"
        @suspend="handleAction('suspend', $event)"
      />
    </div>

    <div v-else class="text-center py-12 text-gray-400">
      <p class="text-3xl mb-2">📋</p>
      <p class="text-sm">No hay demos en esta categoría</p>
    </div>
  </div>
</template>
