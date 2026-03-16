import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Toast {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function show(message: string, type: Toast['type'] = 'info', duration = 3500) {
    const id = nextId++
    toasts.value.push({ id, type, message, duration })
    setTimeout(() => dismiss(id), duration)
  }

  function success(message: string) { show(message, 'success') }
  function error(message: string) { show(message, 'error', 5000) }
  function warning(message: string) { show(message, 'warning') }
  function info(message: string) { show(message, 'info') }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, show, success, error, warning, info, dismiss }
})
