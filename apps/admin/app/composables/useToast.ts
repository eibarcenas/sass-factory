export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function add(message: string, type: ToastType = 'info', duration = 4000) {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, type, message, duration }
    toasts.value.push(toast)
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }

  function remove(id: string) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function success(message: string) {
    return add(message, 'success')
  }

  function error(message: string) {
    return add(message, 'error', 6000)
  }

  function info(message: string) {
    return add(message, 'info')
  }

  function warning(message: string) {
    return add(message, 'warning')
  }

  return { toasts: readonly(toasts), add, remove, success, error, info, warning }
}
