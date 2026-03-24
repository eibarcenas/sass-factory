export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('click-outside', {
    beforeMount(el, binding) {
      el._clickOutsideHandler = (event: MouseEvent) => {
        if (!el.contains(event.target as Node)) {
          binding.value(event)
        }
      }
      document.addEventListener('mousedown', el._clickOutsideHandler)
    },
    unmounted(el) {
      document.removeEventListener('mousedown', el._clickOutsideHandler)
    },
  })
})
