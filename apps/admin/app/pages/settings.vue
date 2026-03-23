<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-500 mt-1">Manage your SASS Factory configuration.</p>
    </div>

    <div class="space-y-6">
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Firebase Configuration</h2>
        <p class="text-sm text-gray-500 mb-4">
          Configure your Firebase project settings via environment variables.
          See <code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.example</code> for reference.
        </p>
        <div class="bg-gray-50 rounded-xl p-4 font-mono text-xs text-gray-600 space-y-1">
          <p>FIREBASE_API_KEY=...</p>
          <p>FIREBASE_AUTH_DOMAIN=...</p>
          <p>FIREBASE_PROJECT_ID=...</p>
          <p>FIREBASE_STORAGE_BUCKET=...</p>
          <p>FIREBASE_MESSAGING_SENDER_ID=...</p>
          <p>FIREBASE_APP_ID=...</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">About</h2>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">Version</dt>
            <dd class="font-medium text-gray-900">0.1.0</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Stack</dt>
            <dd class="font-medium text-gray-900">Nuxt 4 + UnoCSS + Firebase</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Package Manager</dt>
            <dd class="font-medium text-gray-900">pnpm</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
