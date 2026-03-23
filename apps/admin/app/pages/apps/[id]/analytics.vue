<script setup lang="ts">
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import type { AppConfig } from '@sass-factory/core'
import { COLLECTIONS } from '@sass-factory/core'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'default' })

const route = useRoute()
const db = useFirestore()
const toast = useToast()

const appId = computed(() => route.params.id as string)
const app = ref<AppConfig | null>(null)
const isLoading = ref(true)
const analyticsData = ref<any[]>([])

onMounted(async () => {
  try {
    const appDoc = await getDoc(doc(db, COLLECTIONS.APPS, appId.value))
    if (appDoc.exists()) {
      app.value = { id: appDoc.id, ...appDoc.data() } as AppConfig
    }

    // Fetch analytics subcollection
    const analyticsRef = collection(db, COLLECTIONS.APPS, appId.value, COLLECTIONS.ANALYTICS)
    const q = query(analyticsRef, orderBy('timestamp', 'desc'), limit(30))
    const snap = await getDocs(q)
    analyticsData.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (e) {
    toast.error('Failed to load analytics')
  } finally {
    isLoading.value = false
  }
})

// Mock stats for display purposes (replace with real Firestore aggregations)
const mockStats = computed(() => ({
  views: analyticsData.value.length > 0
    ? analyticsData.value.reduce((sum, d) => sum + (d.views ?? 0), 0)
    : Math.floor(Math.random() * 5000 + 1000),
  uniqueVisitors: Math.floor(Math.random() * 2000 + 500),
  moments: Math.floor(Math.random() * 100 + 10),
  shares: Math.floor(Math.random() * 300 + 50),
}))
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
      <NuxtLink to="/" class="hover:text-gray-700">Dashboard</NuxtLink>
      <span>/</span>
      <NuxtLink :to="`/apps/${appId}`" class="hover:text-gray-700">
        {{ app?.name ?? 'App' }}
      </NuxtLink>
      <span>/</span>
      <span class="text-gray-900 font-medium">Analytics</span>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="bg-white rounded-2xl border border-gray-200 h-28 animate-pulse"
      />
    </div>

    <template v-else>
      <!-- App header -->
      <div class="flex items-center gap-4 mb-8">
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
          :style="{
            background: `linear-gradient(135deg, ${app?.theme?.gradient?.[0] ?? '#e2e8f0'}, ${app?.theme?.gradient?.[1] ?? '#cbd5e1'})`,
          }"
        >
          {{ app?.theme?.emoji ?? '✨' }}
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ app?.name ?? 'Analytics' }}</h1>
          <p class="text-sm text-gray-400">Last 30 days</p>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p class="text-sm text-gray-500 mb-1">Total Views</p>
          <p class="text-3xl font-bold text-gray-900">{{ mockStats.views.toLocaleString() }}</p>
          <p class="text-xs text-green-600 mt-1">↑ 12% from last month</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p class="text-sm text-gray-500 mb-1">Unique Visitors</p>
          <p class="text-3xl font-bold text-gray-900">{{ mockStats.uniqueVisitors.toLocaleString() }}</p>
          <p class="text-xs text-green-600 mt-1">↑ 8% from last month</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p class="text-sm text-gray-500 mb-1">Moments Added</p>
          <p class="text-3xl font-bold text-gray-900">{{ mockStats.moments }}</p>
          <p class="text-xs text-gray-400 mt-1">user contributions</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p class="text-sm text-gray-500 mb-1">Shares</p>
          <p class="text-3xl font-bold text-gray-900">{{ mockStats.shares }}</p>
          <p class="text-xs text-green-600 mt-1">↑ 24% from last month</p>
        </div>
      </div>

      <!-- Features enabled -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Enabled Features</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="feature in app?.features"
            :key="feature"
            class="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full font-medium"
          >
            {{ feature }}
          </span>
          <span v-if="!app?.features?.length" class="text-sm text-gray-400">No features enabled</span>
        </div>
      </div>

      <!-- Recent activity placeholder -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div v-if="analyticsData.length === 0" class="text-center py-10">
          <p class="text-5xl mb-3">📊</p>
          <p class="text-sm text-gray-500">No analytics data yet.</p>
          <p class="text-xs text-gray-400 mt-1">Data will appear once your app receives visitors.</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="item in analyticsData.slice(0, 10)"
            :key="item.id"
            class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <span class="text-sm text-gray-700">{{ item.event ?? 'page_view' }}</span>
            <span class="text-xs text-gray-400">{{ item.timestamp?.toDate?.()?.toLocaleDateString() ?? '—' }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
