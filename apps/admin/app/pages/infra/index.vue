<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Infrastructure</h1>
        <p class="text-gray-500 mt-1">Manage GCP and Firebase provisioning for your apps.</p>
      </div>
      <NuxtLink
        to="/infra/new"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <span>+</span>
        Register New
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div class="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
      <div class="text-5xl mb-4">🏗️</div>
      <p class="text-lg font-semibold text-gray-700 mb-1">No infrastructure registered</p>
      <p class="text-sm text-gray-400 mb-6">
        Register a GCP project to start provisioning themed apps.
      </p>
      <NuxtLink
        to="/infra/new"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Register First Infrastructure
      </NuxtLink>
    </div>
  </div>
</template>
