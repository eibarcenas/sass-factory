<script setup lang="ts">
import type { AppConfig } from '@sass-factory/core'
import { useApps } from '~/composables/useApps'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'default' })

const { apps, deleteApp } = useApps()
const toast = useToast()
const router = useRouter()

const filterStatus = ref<'' | 'draft' | 'active' | 'archived'>('')
const searchQuery = ref('')

const filteredApps = computed(() => {
  if (!apps.value) return []
  return apps.value.filter((app) => {
    const matchesStatus = !filterStatus.value || app.status === filterStatus.value
    const matchesSearch =
      !searchQuery.value ||
      app.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      app.slug?.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesStatus && matchesSearch
  })
})

const stats = computed(() => {
  const all = apps.value ?? []
  return {
    total: all.length,
    active: all.filter((a) => a.status === 'active').length,
    draft: all.filter((a) => a.status === 'draft').length,
    archived: all.filter((a) => a.status === 'archived').length,
  }
})

async function handleDelete(id: string) {
  if (!confirm('Are you sure you want to delete this app?')) return
  try {
    await deleteApp(id)
    toast.success('App deleted successfully')
  } catch (e) {
    toast.error('Failed to delete app')
  }
}

function handleEdit(id: string) {
  router.push(`/apps/${id}`)
}

function handleView(id: string) {
  const app = apps.value?.find((a) => a.id === id)
  if (app?.domain) {
    window.open(`https://${app.domain}`, '_blank')
  } else {
    router.push(`/apps/${id}/analytics`)
  }
}

const statCards = computed(() => [
  {
    label: 'Total Apps',
    value: stats.value.total,
    icon: '📱',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    label: 'Active',
    value: stats.value.active,
    icon: '✅',
    color: 'from-green-500 to-emerald-500',
  },
  {
    label: 'Draft',
    value: stats.value.draft,
    icon: '✏️',
    color: 'from-yellow-400 to-orange-400',
  },
  {
    label: 'Archived',
    value: stats.value.archived,
    icon: '📦',
    color: 'from-gray-400 to-slate-400',
  },
])
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-500 mt-1">Manage all your themed apps from one place.</p>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm"
      >
        <div
          class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shrink-0"
          :class="stat.color"
        >
          {{ stat.icon }}
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
          <p class="text-sm text-gray-500">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Search & filter bar -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="relative flex-1">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search apps..."
          class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <select
        v-model="filterStatus"
        class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </select>
      <NuxtLink
        to="/apps/new"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New App
      </NuxtLink>
    </div>

    <!-- Loading state -->
    <div v-if="!apps" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-white rounded-2xl border border-gray-200 h-64 animate-pulse"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredApps.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div class="text-6xl mb-4">🌟</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        {{ apps.length === 0 ? 'No apps yet' : 'No apps match your search' }}
      </h3>
      <p class="text-sm text-gray-500 mb-6 max-w-sm">
        {{
          apps.length === 0
            ? 'Create your first themed app to get started.'
            : 'Try adjusting your filters or search query.'
        }}
      </p>
      <NuxtLink
        v-if="apps.length === 0"
        to="/apps/new"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
      >
        Create First App
      </NuxtLink>
    </div>

    <!-- Apps grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="app in filteredApps"
        :key="app.id"
        class="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        <!-- Gradient header with emoji -->
        <div
          class="h-28 w-full flex items-center justify-center text-5xl relative"
          :style="{
            background: `linear-gradient(135deg, ${app.theme?.gradient?.[0] ?? '#e2e8f0'}, ${app.theme?.gradient?.[1] ?? '#cbd5e1'})`,
          }"
        >
          <span class="drop-shadow-sm">{{ app.theme?.emoji ?? '✨' }}</span>
          <!-- Status badge -->
          <span
            class="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full border"
            :class="{
              'bg-yellow-100 text-yellow-800 border-yellow-200': app.status === 'draft',
              'bg-green-100 text-green-800 border-green-200': app.status === 'active',
              'bg-gray-100 text-gray-600 border-gray-200': app.status === 'archived',
            }"
          >
            {{ app.status ?? 'draft' }}
          </span>
        </div>

        <!-- Content -->
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 text-base truncate">{{ app.name }}</h3>
          <p class="text-sm text-gray-400 mt-0.5 truncate font-mono text-xs">
            /{{ app.slug }}
          </p>

          <div class="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span>{{ app.features?.length ?? 0 }} features</span>
            <span class="w-1 h-1 rounded-full bg-gray-300" />
            <span>{{ app.topic }}</span>
          </div>

          <!-- Color swatches -->
          <div class="flex gap-1.5 mt-3">
            <div
              v-if="app.theme?.primary"
              class="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
              :style="{ backgroundColor: app.theme.primary }"
              title="Primary"
            />
            <div
              v-if="app.theme?.secondary"
              class="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
              :style="{ backgroundColor: app.theme.secondary }"
              title="Secondary"
            />
            <div
              v-if="app.theme?.accent"
              class="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
              :style="{ backgroundColor: app.theme.accent }"
              title="Accent"
            />
            <div
              v-if="app.theme?.background"
              class="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
              :style="{ backgroundColor: app.theme.background }"
              title="Background"
            />
            <span class="ml-auto text-xs text-gray-400 italic" v-if="app.theme?.font">
              {{ app.theme.font }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-4 pb-4 flex gap-2">
          <button
            class="flex-1 text-xs font-medium py-1.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
            @click="handleView(app.id)"
          >
            View
          </button>
          <button
            class="flex-1 text-xs font-medium py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
            @click="handleEdit(app.id)"
          >
            Edit
          </button>
          <button
            class="text-xs font-medium py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
            @click="handleDelete(app.id)"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
