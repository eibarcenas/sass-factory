<script setup lang="ts">
import { useAppConfig } from '~/composables/useAppConfig'
import { useTheme } from '~/composables/useTheme'

const { appConfig, isLoading, error } = useAppConfig()
const { applyTheme } = useTheme()

// Apply theme whenever config loads
watch(
  () => appConfig.value?.theme,
  (theme) => {
    if (theme) applyTheme(theme)
  },
  { immediate: true },
)

const hasFeature = (feature: string) => appConfig.value?.features?.includes(feature as any) ?? false

useSeoMeta({
  title: () => appConfig.value?.metadata?.title ?? 'My App',
  description: () => appConfig.value?.metadata?.description ?? '',
  ogTitle: () => appConfig.value?.metadata?.title ?? 'My App',
  ogDescription: () => appConfig.value?.metadata?.description ?? '',
  ogImage: () => appConfig.value?.metadata?.ogImage ?? '',
})
</script>

<template>
  <div
    class="min-h-screen"
    :style="{ backgroundColor: appConfig?.theme?.background ?? '#ffffff' }"
  >
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <div
          class="w-16 h-16 rounded-2xl mx-auto mb-4 animate-pulse"
          style="background: linear-gradient(135deg, var(--gradient-start, #e2e8f0), var(--gradient-end, #cbd5e1))"
        />
        <p class="text-gray-500 text-sm">Loading your experience...</p>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <p class="text-5xl mb-4">😕</p>
        <h1 class="text-xl font-semibold text-gray-900 mb-2">App Not Found</h1>
        <p class="text-sm text-gray-500">{{ error }}</p>
      </div>
    </div>

    <!-- App content -->
    <template v-else-if="appConfig">
      <!-- HERO section -->
      <section
        v-if="hasFeature('hero')"
        class="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden"
        :style="{
          background: `linear-gradient(135deg, ${appConfig.theme?.gradient?.[0] ?? '#e2e8f0'}, ${appConfig.theme?.gradient?.[1] ?? '#cbd5e1'})`,
        }"
      >
        <!-- Decorative circles -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            class="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20 blur-3xl"
            :style="{ backgroundColor: appConfig.theme?.primary ?? '#e11d48' }"
          />
          <div
            class="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-20 blur-3xl"
            :style="{ backgroundColor: appConfig.theme?.accent ?? '#fb7185' }"
          />
        </div>

        <div class="relative z-10 max-w-2xl mx-auto">
          <div class="text-8xl mb-6 animate-bounce-slow">{{ appConfig.theme?.emoji ?? '✨' }}</div>
          <h1
            class="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-md"
            :style="{ fontFamily: `'${appConfig.theme?.font ?? 'serif'}', serif` }"
          >
            {{ appConfig.metadata?.title ?? appConfig.name }}
          </h1>
          <p class="text-white/80 text-xl max-w-lg mx-auto leading-relaxed">
            {{ appConfig.metadata?.description ?? '' }}
          </p>
          <div class="mt-10 flex flex-wrap gap-4 justify-center">
            <a
              v-if="hasFeature('gallery')"
              href="#gallery"
              class="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-2xl transition-all border border-white/30"
            >
              View Gallery
            </a>
            <a
              v-if="hasFeature('timeline')"
              href="#timeline"
              class="px-6 py-3 bg-white text-gray-800 hover:bg-white/90 font-medium rounded-2xl transition-all shadow-md"
              :style="{ color: appConfig.theme?.primary ?? '#e11d48' }"
            >
              Our Story
            </a>
          </div>
        </div>
      </section>

      <!-- TIMELINE section -->
      <section
        v-if="hasFeature('timeline')"
        id="timeline"
        class="py-20 px-6"
        :style="{ backgroundColor: appConfig.theme?.background ?? '#fff' }"
      >
        <div class="max-w-3xl mx-auto">
          <h2
            class="text-3xl sm:text-4xl font-bold text-center mb-12"
            :style="{ color: appConfig.theme?.primary ?? '#e11d48', fontFamily: `'${appConfig.theme?.font ?? 'serif'}', serif` }"
          >
            Our Story
          </h2>
          <div class="relative">
            <div
              class="absolute left-4 top-0 bottom-0 w-0.5"
              :style="{ backgroundColor: appConfig.theme?.secondary ?? '#fda4af' }"
            />
            <div class="space-y-8 pl-12">
              <div
                v-for="(item, i) in [
                  { year: '2020', title: 'The Beginning', desc: 'Where it all started...' },
                  { year: '2021', title: 'Growing Together', desc: 'Every moment counts.' },
                  { year: '2022', title: 'Adventures', desc: 'Life is an adventure with you.' },
                  { year: 'Today', title: 'Always', desc: 'And so the story continues...' },
                ]"
                :key="i"
                class="relative"
              >
                <div
                  class="absolute -left-11 w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center"
                  :style="{ backgroundColor: appConfig.theme?.primary ?? '#e11d48' }"
                />
                <div class="bg-white rounded-2xl p-5 shadow-sm border"
                  :style="{ borderColor: appConfig.theme?.secondary ?? '#fda4af' }"
                >
                  <span
                    class="text-xs font-bold uppercase tracking-wider"
                    :style="{ color: appConfig.theme?.accent ?? '#fb7185' }"
                  >
                    {{ item.year }}
                  </span>
                  <h3
                    class="text-lg font-semibold mt-1 mb-2"
                    :style="{ color: appConfig.theme?.primary ?? '#e11d48' }"
                  >
                    {{ item.title }}
                  </h3>
                  <p class="text-gray-600 text-sm">{{ item.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- GALLERY section -->
      <section
        v-if="hasFeature('gallery')"
        id="gallery"
        class="py-20 px-6"
        :style="{ backgroundColor: appConfig.theme?.secondary ? `${appConfig.theme.secondary}20` : '#f9fafb' }"
      >
        <div class="max-w-5xl mx-auto">
          <h2
            class="text-3xl sm:text-4xl font-bold text-center mb-12"
            :style="{ color: appConfig.theme?.primary ?? '#e11d48', fontFamily: `'${appConfig.theme?.font ?? 'serif'}', serif` }"
          >
            Memories
          </h2>
          <!-- Gallery placeholder grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div
              v-for="i in 6"
              :key="i"
              class="aspect-square rounded-2xl overflow-hidden shadow-md relative"
              :style="{
                background: `linear-gradient(135deg, ${appConfig.theme?.gradient?.[0] ?? '#e2e8f0'}40, ${appConfig.theme?.gradient?.[1] ?? '#cbd5e1'}60)`,
              }"
            >
              <div class="absolute inset-0 flex items-center justify-center text-4xl opacity-40">
                {{ appConfig.theme?.emoji ?? '✨' }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- LETTER section -->
      <section
        v-if="hasFeature('letter')"
        id="letter"
        class="py-20 px-6"
        :style="{ backgroundColor: appConfig.theme?.background ?? '#fff' }"
      >
        <div class="max-w-2xl mx-auto">
          <h2
            class="text-3xl sm:text-4xl font-bold text-center mb-12"
            :style="{ color: appConfig.theme?.primary ?? '#e11d48', fontFamily: `'${appConfig.theme?.font ?? 'serif'}', serif` }"
          >
            A Letter For You
          </h2>
          <div
            class="bg-white rounded-3xl p-8 sm:p-12 shadow-lg border"
            :style="{ borderColor: appConfig.theme?.secondary ?? '#fda4af' }"
          >
            <p
              class="text-xl text-center mb-8"
              :style="{ color: appConfig.theme?.accent ?? '#fb7185' }"
            >
              {{ appConfig.theme?.emoji }} {{ appConfig.theme?.emoji }} {{ appConfig.theme?.emoji }}
            </p>
            <p
              class="text-gray-700 leading-relaxed text-lg italic"
              :style="{ fontFamily: `'${appConfig.theme?.font ?? 'serif'}', serif` }"
            >
              Dear you,<br /><br />
              Every day with you is a treasure. This app was made with love, just for you.
              May every moment we share be filled with joy and warmth.<br /><br />
              With all my love,<br />
              Always ❤️
            </p>
          </div>
        </div>
      </section>

      <!-- MOMENTS section -->
      <section
        v-if="hasFeature('moments')"
        id="moments"
        class="py-20 px-6"
        :style="{ backgroundColor: appConfig.theme?.secondary ? `${appConfig.theme.secondary}20` : '#f9fafb' }"
      >
        <div class="max-w-3xl mx-auto text-center">
          <h2
            class="text-3xl sm:text-4xl font-bold mb-4"
            :style="{ color: appConfig.theme?.primary ?? '#e11d48', fontFamily: `'${appConfig.theme?.font ?? 'serif'}', serif` }"
          >
            Add Your Moment
          </h2>
          <p class="text-gray-500 mb-8">Share a special memory or message.</p>
          <div class="bg-white rounded-2xl p-6 shadow-sm border" :style="{ borderColor: appConfig.theme?.secondary ?? '#fda4af' }">
            <textarea
              rows="4"
              placeholder="Write your moment here..."
              class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none mb-4"
              :style="{ '--tw-ring-color': appConfig.theme?.primary }"
            />
            <button
              class="w-full py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
              :style="{ backgroundColor: appConfig.theme?.primary ?? '#e11d48' }"
            >
              Share Moment {{ appConfig.theme?.emoji }}
            </button>
          </div>
        </div>
      </section>

      <!-- COUNTDOWN section -->
      <section
        v-if="hasFeature('countdown')"
        id="countdown"
        class="py-20 px-6 text-center"
        :style="{
          background: `linear-gradient(135deg, ${appConfig.theme?.gradient?.[0] ?? '#e2e8f0'}30, ${appConfig.theme?.gradient?.[1] ?? '#cbd5e1'}30)`,
        }"
      >
        <div class="max-w-2xl mx-auto">
          <h2
            class="text-3xl sm:text-4xl font-bold mb-10"
            :style="{ color: appConfig.theme?.primary ?? '#e11d48', fontFamily: `'${appConfig.theme?.font ?? 'serif'}', serif` }"
          >
            Counting Down
          </h2>
          <div class="grid grid-cols-4 gap-4">
            <div
              v-for="unit in [{ label: 'Days', value: '00' }, { label: 'Hours', value: '00' }, { label: 'Minutes', value: '00' }, { label: 'Seconds', value: '00' }]"
              :key="unit.label"
              class="bg-white rounded-2xl p-4 shadow-md"
            >
              <p
                class="text-4xl font-bold"
                :style="{ color: appConfig.theme?.primary ?? '#e11d48' }"
              >
                {{ unit.value }}
              </p>
              <p class="text-xs text-gray-400 mt-1 uppercase tracking-wide">{{ unit.label }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CLOSING section -->
      <section
        v-if="hasFeature('closing')"
        id="closing"
        class="py-24 px-6 text-center"
        :style="{
          background: `linear-gradient(135deg, ${appConfig.theme?.gradient?.[0] ?? '#e2e8f0'}, ${appConfig.theme?.gradient?.[1] ?? '#cbd5e1'})`,
        }"
      >
        <div class="max-w-xl mx-auto">
          <p class="text-6xl mb-6">{{ appConfig.theme?.emoji ?? '✨' }}</p>
          <h2
            class="text-4xl font-bold text-white mb-4 drop-shadow"
            :style="{ fontFamily: `'${appConfig.theme?.font ?? 'serif'}', serif` }"
          >
            With Love
          </h2>
          <p class="text-white/80 text-lg">
            Made with ❤️ for someone special.
          </p>
        </div>
      </section>
    </template>
  </div>
</template>

<style>
:root {
  --color-primary: #e11d48;
  --color-secondary: #fda4af;
  --color-accent: #fb7185;
  --color-background: #fff1f2;
  --gradient-start: #fda4af;
  --gradient-end: #e11d48;
  --font-heading: 'Playfair Display', serif;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}

.animate-bounce-slow {
  animation: bounce-slow 2s infinite;
}
</style>
