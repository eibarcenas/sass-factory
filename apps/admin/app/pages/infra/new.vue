<script setup lang="ts">
// TODO(sprint-1): re-implement provisioning against the real infra layer
definePageMeta({ layout: 'default' })
</script>

<template>
  <div>
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <NuxtLink to="/" class="hover:text-gray-700 transition-colors">Dashboard</NuxtLink>
        <span>/</span>
        <NuxtLink to="/infra" class="hover:text-gray-700 transition-colors">Infrastructure</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 font-medium">New</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Register Infrastructure</h1>
      <p class="text-gray-500 mt-1">Infrastructure provisioning will be available in a future sprint.</p>
    </div>

    <div class="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
      <div class="text-5xl mb-4">🏗️</div>
      <p class="text-lg font-semibold text-gray-700 mb-1">Coming soon</p>
      <p class="text-sm text-gray-400 mb-6">Provisioning UI is being rebuilt for the real infrastructure layer.</p>
      <NuxtLink
        to="/infra"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Back to Infrastructure
      </NuxtLink>
    </div>
  </div>
</template>
