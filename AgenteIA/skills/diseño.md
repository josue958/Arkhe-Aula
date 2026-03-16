# Skill: Diseño

## Propósito

Este skill define las convenciones, arquitectura, reglas de estilo de código, buenas prácticas y patrones de diseño específicos para el frontend de Arkhe Aula.

## Identidad Visual

### Tipografía

| Tipo | Fuente |
| :--- | :--- |
| **Principal** | Sans Serif |
| **Secundaria (Cuerpo de texto)** | Inter |

### Paleta de Colores

| Color | Código Hex | Uso Sugerido |
| :--- | :--- | :--- |
| **Primario** | `#0D1B2A` | Fondos oscuros, headers |
| **Secundario** | `#1B9AAA` | Botones, enlaces, accents |
| **Terciario** | `#E1A140` | Alertas, destacados, CTAs |
| **Neutro** | `#E0E1DD` | Fondos claros, textos secundarios |

### Iconografía

- **Ubicación:** Todos los iconos del sistema deben tomarse de la carpeta `iconos/`
- **Formato:** PNG, SVG
- **Convención:** Nombres descriptivos en minúsculas con guiones

## Arquitectura General

### Framework

- **Vue.js 3.5.0** con Composition API
- **TypeScript** para tipado estático
- **Vite 6.2.4** como build tool

## Estructura de Directorios

```text
src/
├── assets/          # Recursos estáticos (imágenes, fuentes, iconos)
├── components/      # Componentes reutilizables
├── layouts/         # Layouts principales de la aplicación
├── pages/           # Vistas/páginas de la aplicación
├── router/          # Configuración de rutas
├── services/        # Servicios y llamadas a API/IPC
├── stores/          # Stores de Pinia (estado global)
├── types/           # Definiciones de tipos TypeScript
├── utils/           # Utilidades y helpers
├── App.vue          # Componente raíz
└── main.ts          # Punto de entrada
```

## Convenciones de Código

### Nomenclatura de Archivos

| Tipo | Convención | Ejemplo |
| :--- | :--- | :--- |
| Componentes Vue | PascalCase | `UsuarioForm.vue` |
| Composables | camelCase con prefijo `use` | `useAuth.ts` |
| Stores | camelCase con sufijo `Store` | `authStore.ts` |
| Tipos/Interfaces | PascalCase | `Usuario.ts` |
| Utilidades | camelCase | `formatDate.ts` |
| Estilos | kebab-case | `variables.css` |

### Componentes Vue

#### Estructura Base

```vue
<script setup lang="ts">
// Imports
import { ref, computed } from 'vue'

// Props
interface Props {
  nombre: string
  edad?: number
}
const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'guardar', valor: string): void
}
const emit = defineEmits<Emits>()

// Estado reactivo
const estado = ref('')

// Computadas
const computado = computed(() => '')

// Métodos
const manejarClick = () => {
  emit('guardar', estado.value)
}
</script>

<template>
  <!-- Template -->
</template>

<style scoped>
/* Estilos */
</style>
```

### TypeScript

#### Definición de Tipos

```typescript
// interfaces.ts
export interface Usuario {
  id: number
  nombre: string
  email: string
  activo: boolean
}

export type EstadoUsuario = 'activo' | 'inactivo' | 'pendiente'
```

#### Uso de Tipos en Componentes

```typescript
// UsuarioForm.vue
<script setup lang="ts">
import type { Usuario } from '@/types/usuario'

const props = defineProps<{
  usuario: Usuario
  modoEdicion: boolean
}>()
</script>
```

## Gestión de Estado

### Pinia Stores

#### Estructura de Store

```typescript
// stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const usuario = ref<Usuario | null>(null)
  const token = ref<string | null>(null)

  // Getters
  const estaAutenticado = computed(() => !!token.value)

  // Actions
  const login = async (credenciales: Credenciales) => {
    // Lógica de autenticación
  }

  const logout = () => {
    usuario.value = null
    token.value = null
  }

  return { usuario, token, estaAutenticado, login, logout }
})
```

## Estilos y Diseño

### Diseño de Referencia: Módulo de Grupos

**IMPORTANTE:** El diseño de toda la aplicación debe seguir el patrón establecido en el módulo de grupos (`src/pages/groups/GroupsPage.vue`).

#### Características del Diseño de Grupos

##### 1. Page Header

```vue
<div class="page-header">
  <div>
    <h2>Grupos</h2>
    <p class="text-muted">Descripción o contador de elementos</p>
  </div>
  <div class="actions">
    <!-- Filtros, búsqueda, botones de acción -->
  </div>
</div>
```

##### 2. Grid de Cards

```vue
<div class="grid-3">
  <div class="card card--glow">
    <!-- Contenido de la card -->
  </div>
</div>
```

##### 3. Elementos Comunes

- **Badges:** Para etiquetas de estado, ciclo, turno
- **Cards con glow:** Efecto hover con sombra
- **Botones jerarquizados:** primary, secondary, ghost, danger
- **Modales:** Overlay + modal con header, body, footer

##### 4. Paleta de Componentes

| Componente | Clase | Uso |
| :--- | :--- | :--- |
| Page Header | `.page-header` | Encabezado de página con título y acciones |
| Grid | `.grid-3` | Grid de 3 columnas responsive |
| Card | `.card` | Contenedor con sombra y bordes redondeados |
| Card Glow | `.card--glow` | Card con efecto hover brillante |
| Badge | `.badge` | Etiquetas pequeñas de estado |
| Badge Primary | `.badge-primary` | Badge de color primario |
| Badge Neutral | `.badge-neutral` | Badge gris neutro |
| Badge ID Primario | `.badge-id-primario` | Badge con color de identidad primario |
| Badge ID Secundario | `.badge-id-secundario` | Badge con color de identidad secundario (ej. Asistencia) |
| Badge ID Terciario | `.badge-id-terciario` | Badge con color de identidad terciario (ej. Retardo) |
| Badge ID Neutro | `.badge-id-neutro` | Badge con color de identidad neutro |
| Modal Overlay | `.modal-overlay` | Fondo oscuro para modales |
| Modal | `.modal` | Contenedor del modal |

##### 5. Botones de Colores

**Descripción:** Diseño de botones o etiquetas con fondo oscuro, borde lateral de color vibrante y texto claro. Inspirado en el diseño de las notificaciones del sistema.

**Clases:**

- `.btn-color`: Clase base para el diseño.
- `.btn-color-primary`: Borde color primario (`#0D1B2A`).
- `.btn-color-secondary`: Borde color secundario (`#1B9AAA`).
- `.btn-color-tertiary`: Borde color terciario (`#E1A140`).
- `.btn-color-danger`: Borde color rojo (`#EF4444`).
- `.btn-color-success`: Borde color verde (`#10B981`).

**Estructura Sugerida:**

```vue
<span class="btn-color btn-color-primary">
  ✓ Texto
</span>
```

**Estilos CSS:**

```css
.btn-color {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #1e293b; /* Fondo oscuro */
  color: #f8fafc; /* Texto claro */
  border: none;
  border-left: 4px solid var(--btn-color, #64748b);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-color-primary { --btn-color: var(--color-primary, #0D1B2A); }
.btn-color-secondary { --btn-color: var(--color-secondary, #1B9AAA); }
.btn-color-tertiary { --btn-color: var(--color-tertiary, #E1A140); }
.btn-color-danger { --btn-color: #ef4444; }
.btn-color-success { --btn-color: #10b981; }
```

##### 6. Toggle Switch (Interruptor estilo iPhone)

**Descripción:** Interruptor deslizante para activar/desactivar opciones.

**Estructura:**

```vue
<button 
  class="toggle-switch" 
  :class="{ 'toggle-on': isEnabled }"
  @click="toggleEnabled"
>
  <span class="toggle-knob"></span>
</button>
```

**Estilos:**

```css
.toggle-switch {
  position: relative;
  width: 51px;
  height: 31px;
  background-color: #e5e7eb;
  border: none;
  border-radius: 31px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.toggle-switch.toggle-on {
  background-color: var(--color-secondary, #1B9AAA);
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 25px;
  height: 25px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.toggle-switch.toggle-on .toggle-knob {
  transform: translateX(20px);
}
```

**Uso en código:**

```typescript
const isEnabled = ref(false)

const toggleEnabled = () => {
  isEnabled.value = !isEnabled.value
  // Guardar configuración
}
```

**Estados:**

- **Apagado:** Fondo gris (`#e5e7eb`), knob a la izquierda
- **Encendido:** Fondo color secundario (`#1B9AAA`), knob a la derecha
- **Hover:** Oscurece el fondo
- **Disabled:** Opacidad 0.6, cursor not-allowed

##### 7. Textarea Autoexpandible (ExpandableTextarea.vue)

**Descripción:** Componente de Vue que reemplaza a los `<input type="text">` cuando se espera texto de más de 200 caracteres. Un textarea que auto-ajusta su altura según el contenido ingresado para permitir visualización completa.

**Estructura:**

```vue
<ExpandableTextarea 
  v-model="textoLargo" 
  :max-length="255" 
  placeholder="Máx 255 caracteres..."
/>
```

**Comportamiento en Tablas o Formularios:**

- Evita que el texto contenido se corte o permanezca oculto.
- Debe usarse en columnas de información extensa como 'Tema', 'Comentarios', 'Observaciones', etc.

## Tipografía Aplicada

```css
/* Principal - Headers, Títulos */
font-family: 'Sans Serif', system-ui, -apple-system, sans-serif;

/* Secundaria - Cuerpo de texto */
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

## Paleta de Colores CSS

```css
:root {
  --color-primario: #0D1B2A;
  --color-secundario: #1B9AAA;
  --color-tertiario: #E1A140;
  --color-neutro: #E0E1DD;
}
```

## Convenciones de Estilos

- Usar **CSS scoped** en componentes Vue
- Preferir **variables CSS** para colores y espaciados
- Usar **clases utilitarias** para patrones repetitivos
- Evitar selectores anidados profundos (máximo 3 niveles)

## Patrones de Diseño Frontend

### Componentes Presentacionales vs Contenedores

```typescript
// Presentacional (solo recibe props y emite eventos)
// components/UsuarioCard.vue

// Contenedor (maneja lógica y estado)
// pages/UsuariosPage.vue
```

### Custom Composables

```typescript
// composables/useUsuarios.ts
export function useUsuarios() {
  const usuarios = ref<Usuario[]>([])
  const cargando = ref(false)

  const cargarUsuarios = async () => {
    cargando.value = true
    // Lógica de carga
    cargando.value = false
  }

  return { usuarios, cargando, cargarUsuarios }
}
```

### Error Handling

```typescript
try {
  await accionAsincrona()
} catch (error) {
  console.error('Error específico:', error)
  // Mostrar notificación al usuario
}
```

## Comunicación con Electron (IPC)

### Desde Renderer

```typescript
// services/ipc.ts
import { ipcRenderer } from 'electron'

export const dbService = {
  consultar: (query: string) => ipcRenderer.invoke('db:consultar', query),
  insertar: (tabla: string, datos: any) => ipcRenderer.invoke('db:insertar', tabla, datos),
  actualizar: (tabla: string, id: number, datos: any) => ipcRenderer.invoke('db:actualizar', tabla, id, datos),
  eliminar: (tabla: string, id: number) => ipcRenderer.invoke('db:eliminar', tabla, id)
}
```

## Buenas Prácticas del Desarrollador

### Performance

- Usar `v-memo` para componentes costosos
- Implementar **lazy loading** en rutas
- Usar **virtual scrolling** para listas largas
- Evitar computadas costosas sin dependencias claras

### Accesibilidad

- Usar atributos `aria-*` cuando sea necesario
- Asegurar contraste de colores adecuado
- Implementar navegación por teclado
- Usar etiquetas semánticas HTML

### Seguridad

- Validar datos en frontend y backend
- Sanitizar inputs del usuario
- No almacenar datos sensibles en localStorage
- Usar HTTPS para comunicaciones externas

### Testing

- Escribir tests unitarios para composables
- Testear stores de Pinia
- Tests E2E para flujos críticos

## Convenciones de Git

### Commits

```text
feat: agregar nueva funcionalidad
fix: corregir bug
docs: actualizar documentación
style: cambios de formato
refactor: refactorización de código
test: agregar/modificar tests
chore: cambios de configuración
```

### Branches

```text
main          # Rama principal de producción
develop       # Rama de desarrollo
feature/*     # Nuevas funcionalidades
fix/*         # Correcciones de bugs
release/*     # Preparación de releases
```

## Recursos Adicionales

### Documentación Oficial

- [Vue.js 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Vue Router](https://router.vuejs.org/)

### Herramientas Recomendadas

- **Volar** - Extensión de VS Code para Vue 3
- **ESLint** - Linting de código
- **Prettier** - Formateo automático
