export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const config = useRuntimeConfig()

  // Mock mode: no Firebase configured — bypass auth for local dev
  if (config.public.mockMode) {
    return
  }

  const { user, initAuth } = useFirebaseAuth()

  if (import.meta.client && !user.value) {
    await initAuth()
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})
