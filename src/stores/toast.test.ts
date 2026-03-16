import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from './toast'

/**
 * Tests para el store de Toast
 */
describe('useToastStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('debe inicializar el store correctamente', () => {
    const store = useToastStore()
    expect(store.toasts).toEqual([])
  })

  it('debe agregar un toast success', () => {
    const store = useToastStore()
    store.success('Mensaje de éxito')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].type).toBe('success')
    expect(store.toasts[0].message).toBe('Mensaje de éxito')
  })

  it('debe agregar un toast error', () => {
    const store = useToastStore()
    store.error('Mensaje de error')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].type).toBe('error')
  })

  it('debe agregar un toast warning', () => {
    const store = useToastStore()
    store.warning('Mensaje de advertencia')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].type).toBe('warning')
  })

  it('debe agregar un toast info', () => {
    const store = useToastStore()
    store.info('Mensaje de información')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].type).toBe('info')
  })

  it('debe eliminar un toast', () => {
    const store = useToastStore()
    store.success('Toast para eliminar')
    expect(store.toasts).toHaveLength(1)
    
    const toastId = store.toasts[0].id
    store.dismiss(toastId)
    expect(store.toasts).toHaveLength(0)
  })
})
