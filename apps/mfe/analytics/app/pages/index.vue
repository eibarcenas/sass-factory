<script setup lang="ts">
import { ref, onMounted } from 'vue'
import StatCard from '~/components/StatCard.vue'

const summary = ref<{ visitsThisMonth: number; clicksThisMonth: number; topProduct: { name: string; clicks: number } | null } | null>(null)
const dailyData = ref<{ date: string; visits: number; clicks: number }[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [s, d] = await Promise.all([
      $fetch<typeof summary.value>('/api/owner/analytics/summary'),
      $fetch<{ data: typeof dailyData.value }>('/api/owner/analytics/daily?days=14'),
    ])
    summary.value = s
    dailyData.value = d.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <h2 class="font-bold text-gray-900 text-lg">Analytics</h2>

    <div v-if="loading" class="grid grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="h-28 bg-gray-100 rounded-2xl animate-pulse" />
    </div>

    <div v-else-if="summary" class="grid grid-cols-3 gap-4">
      <StatCard label="Visitas este mes" :value="summary.visitsThisMonth" trend="+12%" :trend-up="true" />
      <StatCard label="Clicks este mes" :value="summary.clicksThisMonth" trend="+5%" :trend-up="true" />
      <StatCard v-if="summary.topProduct" :label="`Top: ${summary.topProduct.name}`" :value="summary.topProduct.clicks" />
    </div>

    <!-- Simple bar chart using CSS -->
    <div v-if="dailyData.length" class="bg-white rounded-2xl border border-gray-200 p-5">
      <p class="text-sm font-semibold text-gray-700 mb-4">Clicks últimos 14 días</p>
      <div class="flex items-end gap-1 h-24">
        <div
          v-for="day in dailyData"
          :key="day.date"
          class="flex-1 bg-indigo-500 rounded-t min-h-1 transition-all hover:bg-indigo-600"
          :style="{ height: `${(day.clicks / Math.max(...dailyData.map(d => d.clicks))) * 100}%` }"
          :title="`${day.date}: ${day.clicks} clicks`"
        />
      </div>
      <div class="flex justify-between mt-1">
        <span class="text-xs text-gray-400">{{ dailyData[0]?.date.slice(5) }}</span>
        <span class="text-xs text-gray-400">{{ dailyData.at(-1)?.date.slice(5) }}</span>
      </div>
    </div>
  </div>
</template>
