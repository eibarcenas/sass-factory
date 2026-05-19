export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth page
  if (to.path === '/login') return

  const { user, initAuth } = useFirebaseAuth()

  // On client, wait for Firebase to resolve auth state
  if (import.meta.client && !user.value) {
    await initAuth()
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})
