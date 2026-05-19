export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  telemetry: false,

  // SSG for known slugs, SSR fallback for new ones
  routeRules: {
    '/:slug': { isr: 60 },        // revalidate every 60s
    '/demo/:slug': { ssr: true },  // always SSR for demo
    '/404': { prerender: true },
    '/suspended': { prerender: true },
  },

  css: ['@sass-factory/tokens/dist/tokens.css'],

  modules: [],
})
