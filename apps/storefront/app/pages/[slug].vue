<script setup lang="ts">
import type { Business, Item } from '@sass-factory/core'
import StorefrontHeader from '~/components/StorefrontHeader.vue'
import CategoryFilter from '~/components/CategoryFilter.vue'
import ProductGrid from '~/components/ProductGrid.vue'
import ProductModal from '~/components/ProductModal.vue'
import ViralFooter from '~/components/ViralFooter.vue'

const route = useRoute()
const slug = route.params.slug as string

const { data: business, error } = await useFetch<Business & { items: Item[] }>(
  `/api/storefront/${slug}`,
)

if (error.value?.statusCode === 410) {
  await navigateTo('/suspended', { redirectCode: 301 })
}
if (error.value) {
  throw createError({ statusCode: 404, message: 'Business not found' })
}

const selectedCategory = ref('')
const selectedItem = ref<Item | null>(null)

const categories = computed(() => {
  const cats = business.value?.items
    .map((i) => i.category)
    .filter((c): c is string => !!c)
  return [...new Set(cats ?? [])]
})

const filteredItems = computed(() =>
  (business.value?.items ?? []).filter(
    (i) => i.visible && (!selectedCategory.value || i.category === selectedCategory.value),
  ),
)

useSeoMeta({
  title: () => business.value?.name ?? 'Catálogo',
  description: () => business.value?.tagline ?? '',
  ogTitle: () => business.value?.name ?? '',
  ogDescription: () => business.value?.tagline ?? '',
})
</script>

<template>
  <div v-if="business">
    <StorefrontHeader :business="business" />

    <main class="max-w-2xl mx-auto px-4 py-6">
      <div v-if="business.tagline" class="mb-4 text-center">
        <p class="text-gray-600 text-sm">{{ business.tagline }}</p>
      </div>

      <div v-if="categories.length" class="mb-4">
        <CategoryFilter v-model="selectedCategory" :categories="categories" />
      </div>

      <ProductGrid
        :items="filteredItems"
        :primary-color="business.theme.primary"
        @select="selectedItem = $event"
      />

      <ViralFooter />
    </main>

    <ProductModal
      :item="selectedItem"
      :whatsapp="business.whatsapp"
      @close="selectedItem = null"
    />
  </div>
</template>
