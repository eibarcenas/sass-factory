<script setup lang="ts">
import GenerateForm from '~/components/GenerateForm.vue'
import DemoList from '~/components/DemoList.vue'
import type { Business } from '@sass-factory/core'

const newBusiness = ref<Business | null>(null)
const showForm = ref(false)

function onGenerated(business: Business) {
  newBusiness.value = business
  showForm.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Demos</h1>
        <p class="text-sm text-gray-500">Genera y gestiona demos para prospectos</p>
      </div>
      <button
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Cancelar' : '+ Nuevo demo' }}
      </button>
    </div>

    <div v-if="showForm" class="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 class="font-semibold text-gray-900 mb-4">Generar nuevo demo con AI</h2>
      <GenerateForm @generated="onGenerated" />
    </div>

    <DemoList />
  </div>
</template>
