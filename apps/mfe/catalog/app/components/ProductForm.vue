<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { Item } from '@sass-factory/core'
import { Button, Input } from '@sass-factory/ui'

defineProps<{ loading?: boolean }>()
const emit = defineEmits<{ submit: [data: Partial<Item>] }>()

const form = reactive({ name: '', price: '' as string | number, description: '', category: '', visible: true })
const nameError = ref('')

function validate() {
  nameError.value = ''
  if (!form.name.trim()) { nameError.value = 'El nombre es requerido'; return false }
  if (form.name.length > 80) { nameError.value = 'Máximo 80 caracteres'; return false }
  if (Number(form.price) < 0) { nameError.value = 'El precio no puede ser negativo'; return false }
  return true
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: form.name.trim(),
    price: Number(form.price),
    description: form.description.trim() || undefined,
    category: form.category.trim() || undefined,
    visible: form.visible,
  })
}
</script>

<template>
  <div class="space-y-4">
    <Input v-model="form.name" label="Nombre del producto" placeholder="Ej. Sundae de chocolate" :error="nameError" required />
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Precio (MXN) <span class="text-red-500">*</span></label>
        <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
          <span class="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">$</span>
          <input v-model="form.price" type="number" min="0" placeholder="85" class="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
        </div>
      </div>
      <Input v-model="form.category" label="Categoría" placeholder="Ej. Helados" />
    </div>
    <Input v-model="form.description" label="Descripción" placeholder="Descripción breve..." />
    <div class="flex items-center gap-2">
      <input v-model="form.visible" type="checkbox" id="visible" class="w-4 h-4 rounded border-gray-300 text-indigo-600" />
      <label for="visible" class="text-sm text-gray-700">Visible en el catálogo</label>
    </div>
    <Button variant="primary" :loading="loading" class="w-full" @click="handleSubmit">
      Agregar producto
    </Button>
  </div>
</template>
