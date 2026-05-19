<script setup lang="ts">
import type { Business, Item } from '@sass-factory/core'
import DemoBanner from '~/components/DemoBanner.vue'
import ProspectModal from '~/components/ProspectModal.vue'
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

if (error.value) {
  throw createError({ statusCode: 404, message: 'Demo not found' })
}

const selectedCategory = ref('')
const selectedItem = ref<Item | null>(null)
const showProspectModal = ref(false)

const filteredItems = computed(() =>
  (business.value?.items ?? []).filter(
    (i) => i.visible && (!selectedCategory.value || i.category === selectedCategory.value),
  ),
)

const categories = computed(() => {
  const cats = business.value?.items.map((i) => i.category).filter((c): c is string => !!c)
  return [...new Set(cats ?? [])]
})
</script>

<template>
  <div v-if="business">
    <DemoBanner @want-it="showProspectModal = true" />
    <StorefrontHeader :business="business" />

    <main class="max-w-2xl mx-auto px-4 py-6">
      <p class="text-xs text-center text-gray-400 mb-4 italic">
        (Estos son productos de ejemplo — serán los tuyos)
      </p>

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

    <ProspectModal
      v-if="showProspectModal"
      :business-id="business.id"
      @close="showProspectModal = false"
      @submitted="showProspectModal = false"
    />
  </div>
</template>
