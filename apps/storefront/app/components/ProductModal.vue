<script setup lang="ts">
import type { Item } from '@sass-factory/core'
import { PriceDisplay, Button } from '@sass-factory/ui'
import { buildWhatsAppUrl } from '~/utils/whatsapp'

const props = defineProps<{ item: Item | null; whatsapp: string }>()
const emit = defineEmits<{ close: [] }>()

const quantity = ref(1)

const waUrl = computed(() =>
  props.item
    ? buildWhatsAppUrl(
        props.whatsapp,
        `${quantity.value}x ${props.item.name}`,
        props.item.price * quantity.value,
      )
    : '#',
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="item"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="emit('close')"
      >
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />
        <div class="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-xl">
          <div class="aspect-video bg-gray-100 relative">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-6xl">🛍️</div>
          </div>
          <button
            class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-gray-600 hover:bg-white"
            @click="emit('close')"
          >
            ✕
          </button>
          <div class="p-5">
            <h2 class="font-bold text-gray-900 text-lg">{{ item.name }}</h2>
            <p v-if="item.description" class="text-sm text-gray-500 mt-1">{{ item.description }}</p>
            <div class="flex items-center justify-between mt-4">
              <PriceDisplay :price="item.price * quantity" currency="MXN" size="lg" />
              <div class="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-1.5">
                <button class="text-lg font-bold text-gray-500 w-6 text-center" @click="quantity = Math.max(1, quantity - 1)">−</button>
                <span class="font-semibold w-4 text-center">{{ quantity }}</span>
                <button class="text-lg font-bold text-gray-500 w-6 text-center" @click="quantity++">+</button>
              </div>
            </div>
            <a
              :href="waUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 flex w-full items-center justify-center gap-2 py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Pedir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
