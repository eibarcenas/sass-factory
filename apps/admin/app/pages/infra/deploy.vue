<script setup lang="ts">
// TODO(sprint-1): re-implement GCP deploy against the real Cloud Build integration
definePageMeta({ layout: 'default' })
</script>

<template>
  <div>
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <NuxtLink to="/" class="hover:text-gray-700">Dashboard</NuxtLink>
        <span>/</span>
        <NuxtLink to="/infra" class="hover:text-gray-700">Infrastructure</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 font-medium">Deploy to GCP</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Deploy to GCP</h1>
      <p class="text-gray-500 mt-1">GCP deployment will be available in a future sprint.</p>
    </div>

    <div class="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
      <div class="text-5xl mb-4">🚀</div>
      <p class="text-lg font-semibold text-gray-700 mb-1">Coming soon</p>
      <p class="text-sm text-gray-400 mb-6">GCP Cloud Build deployment is being rebuilt for the real infrastructure layer.</p>
      <NuxtLink
        to="/infra"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Back to Infrastructure
      </NuxtLink>
    </div>
  </div>
</template>
