# Skill: Pruebas

## Propósito
Este skill documenta cómo correr los tests en el proyecto Arkhe Aula, incluyendo configuración, tipos de pruebas y flujos de trabajo.

## Configuración Actual

### Framework de Testing
- **Vitest** ^4.1.0 - Framework de tests compatible con Vite
- **@vue/test-utils** - Utilidades para testear componentes Vue
- **@testing-library/vue** - Librería de testing enfocada en el usuario
- **happy-dom** - Entorno de DOM ligero para tests

### Archivos de Configuración

#### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

#### `tests/setup.ts`
```typescript
import '@testing-library/jest-dom'
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

config.global.plugins = [createPinia()]
```

## Tipos de Pruebas

### 1. Tests Unitarios
Prueban funciones, composables y unidades individuales de código.

**Ubicación:** `src/**/*.test.ts` o `src/**/*.spec.ts`

**Ejemplo:**
```typescript
// src/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('formatea una fecha correctamente', () => {
    const fecha = new Date('2024-01-15')
    expect(formatDate(fecha)).toBe('15/01/2024')
  })
})
```

### 2. Tests de Componentes
Prueban componentes Vue de forma aislada.

**Ubicación:** `src/components/**/*.test.ts`

**Ejemplo:**
```typescript
// src/components/UsuarioCard.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UsuarioCard from './UsuarioCard.vue'

describe('UsuarioCard', () => {
  it('renderiza el nombre del usuario', () => {
    const wrapper = mount(UsuarioCard, {
      props: {
        nombre: 'Juan Pérez',
        email: 'juan@example.com'
      }
    })
    expect(wrapper.text()).toContain('Juan Pérez')
  })
})
```

### 3. Tests de Stores (Pinia)
Prueban la lógica de estado global.

**Ubicación:** `src/stores/**/*.test.ts`

**Ejemplo:**
```typescript
// src/stores/authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('inicializa sin usuario autenticado', () => {
    const store = useAuthStore()
    expect(store.estaAutenticado).toBe(false)
  })

  it('autentica usuario correctamente', async () => {
    const store = useAuthStore()
    await store.login({ email: 'test@test.com', password: '123456' })
    expect(store.estaAutenticado).toBe(true)
  })
})
```

### 4. Tests de Integración
Prueban la interacción entre múltiples componentes/módulos.

**Ubicación:** `tests/integration/**/*.test.ts`

### 5. Tests E2E (End-to-End)
Prueban flujos completos de la aplicación.

**Herramienta recomendada:** Playwright o Cypress

**Ejemplo con Playwright:**
```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('login exitoso', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.fill('[name="email"]', 'admin@arkhe.com')
  await page.fill('[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

## Configuración Recomendada

### vitest.config.ts
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

### tests/setup.ts
```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

config.global.plugins = [createPinia()]
```

### package.json (scripts)
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Comandos para Correr Tests

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run test` | Correr tests en modo watch (desarrollo) |
| `npm run test:run` | Correr tests una vez (CI/CD) |
| `npm run test:ui` | Correr tests con interfaz gráfica |
| `npm run test:coverage` | Correr tests con reporte de cobertura |

### Ejecutar Tests Específicos
```bash
# Test específico por nombre
npm run test -- --testNamePattern="formatDate"

# Test específico por archivo
npm run test -- src/utils/formatDate.test.ts

# Tests en modo watch con filtro
npm run test -- --watch --grep="auth"
```

## Estado Actual de Tests

### Tests Implementados

#### `tests/config.test.ts`
Tests básicos de configuración:
- ✅ Vitest está funcionando correctamente
- ✅ Operaciones matemáticas básicas
- ✅ Creación de objetos
- ✅ Operaciones con arrays

#### `src/stores/toast.test.ts`
Tests para el store de Toast:
- ✅ Inicialización del store
- ✅ Agregar toast success
- ✅ Agregar toast error
- ✅ Agregar toast warning
- ✅ Agregar toast info
- ✅ Eliminar toast

#### `src/pages/ProfilePage.test.ts`
Tests para la funcionalidad de actualizaciones automáticas:
- ✅ Obtener versión de la app
- ✅ Obtener configuración de actualizaciones
- ✅ Guardar configuración de actualizaciones
- ✅ Buscar actualizaciones
- ✅ Lógica del Toggle Switch
- ✅ Estados del componente
- ✅ Plataforma del sistema

#### `src/components/ToggleSwitch.test.ts`
Tests para el componente Toggle Switch:
- ✅ Clases CSS (toggle-on/toggle-off)
- ✅ Estilos del Toggle (dimensiones, colores)
- ✅ Transformación del Knob
- ✅ Estados interactivos (hover, disabled)
- ✅ Accesibilidad
- ✅ Dimensiones del Knob
- ✅ Transiciones

### Resultados Actuales
```
✓ src/stores/toast.test.ts (6 tests) 5ms
✓ src/pages/ProfilePage.test.ts (17 tests) 5ms
✓ src/components/ToggleSwitch.test.ts (20 tests) 3ms

Test Files  3 passed (3)
Tests  43 passed (43)
```

## Flujo de Trabajo de Testing

### Desarrollo con TDD
```bash
# 1. Iniciar tests en modo watch
npm run test

# 2. Escribir test (falla)
# 3. Implementar código (pasa)
# 4. Refactorizar
```

### Antes de Commit
```bash
# Correr todos los tests
npm run test:run

# Verificar cobertura
npm run test:coverage
```

### CI/CD Pipeline
```yaml
# Ejemplo GitHub Actions
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:run
      - run: npm run test:coverage
```

## Testing de IPC (Electron)

### Mock de IPC en Tests
```typescript
// __mocks__/electron.ts
export const ipcRenderer = {
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
}
```

### Test de Servicios IPC
```typescript
// src/services/db.test.ts
import { ipcRenderer } from 'electron'
import { dbService } from './db'

describe('dbService', () => {
  it('consulta la base de datos correctamente', async () => {
    ipcRenderer.invoke.mockResolvedValue([{ id: 1, nombre: 'Test' }])
    
    const resultado = await dbService.consultar('SELECT * FROM usuarios')
    
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('db:consultar', 'SELECT * FROM usuarios')
    expect(resultado).toHaveLength(1)
  })
})
```

## Buenas Prácticas

### Naming de Tests
```typescript
describe('nombreDelComponenteOFuncion', () => {
  it('debe hacer algo cuando algo', () => {
    // Test
  })
})
```

### Arrange-Act-Assert
```typescript
it('calcula el total correctamente', () => {
  // Arrange
  const items = [{ precio: 10 }, { precio: 20 }]
  
  // Act
  const total = calcularTotal(items)
  
  // Assert
  expect(total).toBe(30)
})
```

### Cobertura Mínima Recomendada
- **Statements:** 80%
- **Branches:** 70%
- **Functions:** 80%
- **Lines:** 80%

## Recursos Adicionales

### Documentación
- [Vitest](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

### Herramientas
- **Vitest UI** - Interfaz gráfica para Vitest
- **Playwright Inspector** - Debug de tests E2E
