<script setup lang="ts">
import { StatusBadge } from '@sass-factory/ui'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'

const { user, logout } = useFirebaseAuth()

// Status counts — will be populated by demo-mf-agent in Sprint 4
// For now use mock data; real counts come from Firestore in Sprint 5
const statusCounts = ref({
  draft: 2,
  demo: 5,
  sent: 3,
  accepted: 1,
  active: 12,
  suspended: 0,
})

const navItems = [
  { label: 'Dashboard', icon: '🏠', to: '/' },
  { label: 'Demos', icon: '✨', to: '/demos' },
  { label: 'Negocios', icon: '🏪', to: '/businesses' },
  { label: 'Prospectos', icon: '👥', to: '/prospects' },
]
</script>

<template>
  <aside class="w-64 h-screen flex flex-col bg-white border-r border-gray-200 sticky top-0">
    <!-- Logo -->
    <div class="px-6 py-5 border-b border-gray-100">
      <span class="font-bold text-gray-900 text-lg">catalog.mx</span>
      <p class="text-xs text-gray-400 mt-0.5">Admin Panel</p>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
        active-class="bg-indigo-50 text-indigo-700"
        inactive-class="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      >
        <span class="text-base">{{ item.icon }}</span>
        {{ item.label }}
      </NuxtLink>

      <!-- Status pipeline -->
      <div class="pt-4 px-3">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pipeline</p>
        <div class="space-y-1.5">
          <div
            v-for="(count, status) in statusCounts"
            :key="status"
            class="flex items-center justify-between"
          >
            <StatusBadge :status="status as any" />
            <span class="text-xs font-semibold text-gray-500">{{ count }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- User -->
    <div class="px-4 py-4 border-t border-gray-100">
      <div class="flex items-center justify-between">
        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-900 truncate">{{ user?.email }}</p>
          <p class="text-xs text-gray-400">Admin</p>
        </div>
        <button
          class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          title="Salir"
          @click="logout"
        >
          ↩
        </button>
      </div>
    </div>
  </aside>
</template>
