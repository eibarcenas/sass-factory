const hasFirebase = !!(process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID)

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: { compatibilityVersion: 4 },
  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    ...(hasFirebase ? ['nuxt-vuefire'] : []),
  ],
  unocss: {
    preflight: true,
    icons: true,
  },
  ...(hasFirebase
    ? {
        vuefire: {
          config: {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
          },
        },
      }
    : {}),
  runtimeConfig: {
    public: {
      appName: 'SASS Factory Admin',
      mockMode: !hasFirebase,
    },
  },
})
