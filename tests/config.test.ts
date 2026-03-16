import { describe, it, expect } from 'vitest'

/**
 * Test de ejemplo para verificar que Vitest está configurado correctamente
 */
describe('Configuración de Testing', () => {
  it('Vitest está funcionando correctamente', () => {
    expect(true).toBe(true)
  })

  it('1 + 1 debe ser igual a 2', () => {
    expect(1 + 1).toBe(2)
  })

  it('debe crear un objeto correctamente', () => {
    const obj = { nombre: 'Test', valor: 42 }
    expect(obj.nombre).toBe('Test')
    expect(obj.valor).toBe(42)
  })

  it('debe funcionar con arrays', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr).toHaveLength(5)
    expect(arr).toContain(3)
    expect(arr).not.toContain(6)
  })
})
