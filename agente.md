# Agente de Desarrollo - Arkhe Aula

> **Documento Unificado de Referencia** - Incluye: Información del proyecto, Skills completos y Contexto histórico

---

## Información del Proyecto

| Campo | Valor |
|-------|-------|
| **Sistema** | Arkhe Aula |
| **Empresa** | Arkhe Systems |
| **Descripción** | Sistema de Evaluación Docente para Escritorio |
| **Versión** | 1.12.7 |

---

## Idioma de Comunicación

**Español** - El medio de comunicación entre la IA y el programador es exclusivamente en español.

---

## Rol del Agente

Actúa como **Arquitecto de Software Senior**, **desarrollador experto en bases de datos**, **desarrollador experto en Electron**, **desarrollador experto en Vue.js**, **desarrollador experto en TypeScript**, **desarrollador experto en Node.js**, **desarrollador experto en JavaScript**, **desarrollador experto en HTML**, **desarrollador experto en CSS**, **desarrollador experto en SQL**, **desarrollador experto en Git**.

---

## Stack Tecnológico

### Lenguajes de Programación
| Lenguaje | Versión |
|----------|---------|
| TypeScript | ^5.8.2 |
| JavaScript | ES2020 |
| Vue Template | 3.5.0 |

### Frameworks y Librerías Principales
| Framework/Librería | Versión | Propósito |
|--------------------|---------|-----------|
| Vue.js | ^3.5.0 | Framework frontend |
| Vite | ^6.2.4 | Build tool y dev server |
| Electron | ^22.3.27 | Aplicación de escritorio |
| Pinia | ^3.0.1 | Gestión de estado |
| Vue Router | ^4.5.0 | Enrutamiento |
| VueDraggable | ^4.1.0 | Drag & drop |
| @vueuse/core | ^12.7.0 | Utilidades de Vue |

### Base de Datos
| Base de Datos | Versión | Tipo |
|---------------|---------|------|
| better-sqlite3 | ^8.2.0 | SQLite embebida (local-first) |

**Ubicación del archivo de configuración:** `electron/database.js`

### Librerías Adicionales
| Librería | Versión | Propósito |
|----------|---------|-----------|
| bcryptjs | ^3.0.2 | Encriptación de contraseñas |
| docx | ^9.6.0 | Generación de documentos Word |
| exceljs | ^4.4.0 | Manipulación de Excel |
| xlsx | ^0.18.5 | Exportación Excel |
| qrcode | ^1.5.4 | Generación de códigos QR |
| file-saver | ^2.0.5 | Descarga de archivos |
| electron-updater | ^6.8.3 | Actualizaciones automáticas |

### Herramientas de Desarrollo
| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| @vitejs/plugin-vue | ^5.2.4 | Plugin Vue para Vite |
| vite-plugin-pwa | ^1.2.0 | Soporte PWA |
| vite-plugin-electron | ^0.29.0 | Integración Electron |
| electron-builder | ^24.13.3 | Empaquetado de aplicación |
| vue-tsc | ^2.2.8 | Type checking para Vue |
| concurrently | ^9.1.2 | Ejecución paralela de comandos |
| cross-env | ^7.0.3 | Variables de entorno multiplataforma |
| wait-on | ^8.0.3 | Sincronización de servicios |

---

## Configuración del Proyecto

### Alias de Rutas
- `@/` → `src/`

### Target de Compilación
- **TypeScript Target:** ES2020
- **Node Target:** ES2020
- **Librerías DOM:** DOM, DOM.Iterable

### Plataformas Soportadas
- **Windows:** NSIS installer, Portable (x64, ia32)
- **macOS:** DMG, ZIP (x64, arm64)
- **Versión mínima macOS:** 10.12.0

---

## Estructura del Proyecto

```
src/              # Código Vue.js (frontend)
electron/         # Código Electron (backend)
  - database.js   # Configuración de SQLite
  - main.js       # Proceso principal
  - preload.js    # Script de preload
  - ipc-handlers.js # Manejadores IPC
  - updater.js    # Actualizaciones
AgenteIA/         # Documentación del agente (respaldo)
  - agente.md     # Documento principal (respaldo)
  - skills/       # Skills especializados (respaldo)
  - contexto/     # Memoria de contexto (bugs, soluciones)
iconos/           # Recursos de iconografía
agente.md         # ESTE ARCHIVO - Documento unificado principal
```

---

# SKILLS DISPONIBLES

> **Nota de Lectura:** Cuando se solicite leer este archivo, también debe considerarse el contenido completo de:
> - `AgenteIA/skills/` (todos los archivos .md)
> - `AgenteIA/contexto/` (todos los archivos .md del histórico)
> - `AgenteIA/estructura del sistema.md` (estructura completa del sistema)
> - `AgenteIA/estructura de la basededatos.md` (esquema detallado de la BD)

---

## Tabla de Referencia de Skills

| Skill | Archivo | Ubicación | Propósito |
|-------|---------|-----------|-----------|
| **Compila** | `compila.md` | `AgenteIA/skills/compila.md` | Builds y construcción de versiones |
| **Diseño** | `diseño.md` | `AgenteIA/skills/diseño.md` | Convenciones y arquitectura del frontend |
| **Base de Datos** | `basededatos.md` | `AgenteIA/skills/basededatos.md` | Estructura y normalización de la BD |
| **Instrucciones** | `instrucciones.md` | `AgenteIA/skills/instrucciones.md` | Arrancar servidor e instalar dependencias |
| **Pruebas** | `pruebas.md` | `AgenteIA/skills/pruebas.md` | Cómo correr tests en el proyecto |

---

## Sistema de Actualizaciones - GitHub Releases

### Proveedor
- **Proveedor:** GitHub Releases
- **Repositorio:** `josue958/Arkhe-Aula`
- **Visibilidad:** Repositorio privado, Releases públicos
- **URL de Descargas:** https://github.com/josue958/Arkhe-Aula/releases
- **Página de Descargas:** https://arkhegroup.com/downloads/

### Configuración en package.json
```json
"publish": {
  "provider": "github",
  "owner": "josue958",
  "repo": "Arkhe-Aula",
  "channel": "latest",
  "releaseType": "draft",
  "private": true
}
```

### Flujo de Publicación
1. Crear tag: `npm version patch` (o minor/major)
2. Push del tag: `git push origin v1.12.8`
3. GitHub Actions compila automáticamente
4. Release se crea como draft en GitHub
5. Revisar y publicar release manualmente
6. Usuarios reciben notificación de actualización

### Comandos de Release
```bash
# Release completo (Windows + macOS)
npm run release

# Release solo Windows
npm run release:win

# Release solo macOS
npm run release:mac

# Release como draft
npm run release:draft
```

### GitHub Actions Workflow
- **Archivo:** `.github/workflows/release.yml`
- **Trigger:** Push de tags (`v*`)
- **Builds:** Windows (windows-latest), macOS (macos-latest)
- **Secrets Requeridos:** `GH_TOKEN` (GitHub Personal Access Token)

### Para el Usuario Final
1. El software verifica actualizaciones al iniciar (si está activado)
2. El usuario puede verificar manualmente en Perfil → Verificar
3. Si hay actualización, se muestra notificación con botón de descargar
4. La descarga es automática desde GitHub Releases
5. Al completarse, se solicita reiniciar para instalar
6. Se realiza respaldo automático de la BD antes de actualizar

---

## Skill: Compila

### Propósito
Este skill contiene las instrucciones exactas para realizar builds y construcciones de versiones del proyecto Arkhe Aula.

### Comandos de Construcción

#### Build General (Windows y macOS)
```bash
npm run build
```
- Construye para ambas plataformas (Windows y macOS)
- Genera instaladores y versiones portables
- Ejecuta post-build scripts

#### Build Solo Windows
```bash
npm run build:win
```
- Genera instalador NSIS (x64, ia32)
- Genera versión portable (x64)
- Output: carpeta `Ejecutables/`

#### Build Solo macOS
```bash
npm run build:mac
```
- Genera DMG (x64, arm64)
- Genera ZIP (x64, arm64)
- Output: carpeta `Ejecutables/`

#### Build Solo Vite (Frontend)
```bash
npm run build:vite
```
- Compila el frontend a la carpeta `dist/`
- No incluye empaquetado de Electron

### Flujo de Trabajo para Nueva Versión

#### 1. Verificar Versión Actual
```bash
npm version
```

#### 2. Actualizar Versión (si es necesario)
```bash
# Patch (1.11.0 -> 1.11.1) - Correcciones de bugs menores
npm version patch

# Minor (1.11.0 -> 1.12.0) - Nuevas funcionalidades backwards-compatible
npm version minor

# Major (1.11.0 -> 2.0.0) - Cambios breaking
npm version major
```

**Regla:** El versionado debe seguir **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

#### 3. Limpiar Build Anterior
```bash
rm -rf dist/
# NOTA: No eliminar Ejecutables/ completo para preservar versiones anteriores
```

#### 4. Ejecutar Build
```bash
# Para la plataforma específica
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build        # Ambas plataformas
```

#### 5. Organizar por Versión (Buena Práctica)
**Importante:** Cada nueva versión guardará los archivos compilados en una carpeta con el número de versión dentro de `Ejecutables/` (Ej. `Ejecutables/v1.11.0/`).
> **Nota:** Esto ya lo realiza de manera completamente automática el script `scripts/post-build.js` al finalizar el build con `npm run build`. Los archivos ejecutables se moverán a la versión correspondiente para no ocupar espacio doble. No necesitas ejecutar ningún comando manual para mover los archivos.

**Estructura Resultante:**
```
Ejecutables/
├── v1.11.0/
│   ├── Arkhe Aula Setup 1.11.0.exe
│   ├── Arkhe Aula-Portable-1.11.0.exe
│   ├── Arkhe Aula-1.11.0.dmg
│   └── latest.yml
├── v1.11.1/
│   └── ...
└── v1.12.0/
    └── ...
```

#### 6. Verificar Output
- Revisar carpeta `Ejecutables/v{VERSION}/`
- Verificar que los ejecutables se generaron correctamente
- Validar versión en `About` de la aplicación
- Verificar que el archivo `latest.yml` tenga la versión correcta

### Buenas Prácticas de Compilación

#### Antes del Build
1. **Verificar tests:** Todos los tests deben pasar
   ```bash
   npm run test:run
   ```

2. **Linting:** El código debe estar libre de errores
   ```bash
   npm run lint
   ```

3. **Changelog:** Actualizar `CHANGELOG.md` con los cambios de la versión

4. **Git limpio:** Todos los cambios deben estar commiteados
   ```bash
   git status
   git add .
   git commit -m "chore: preparación para release v{VERSION}"
   ```

5. **Tags:** Crear tag de la versión
   ```bash
   git tag -a v{VERSION} -m "Release v{VERSION}"
   git push origin v{VERSION}
   ```

#### Durante el Build
1. **No interrumpir:** Esperar a que el proceso termine completamente
2. **Monitorear logs:** Verificar que no haya warnings críticos
3. **Recursos:** Asegurar que hay espacio en disco suficiente

#### Después del Build
1. **Verificar integridad:** Los ejecutables deben abrir correctamente
2. **Probar instalación:** Instalar en un entorno limpio
3. **Backup:** Copiar la versión a almacenamiento seguro
4. **Documentar:** Registrar en `contexto/` cualquier incidencia

### Versionado Semántico (SemVer)
| Tipo | Cuándo Usar | Ejemplo |
|------|-------------|---------|
| **PATCH** | Bug fixes, cambios menores internos | 1.11.0 → 1.11.1 |
| **MINOR** | Nuevas funcionalidades backwards-compatible | 1.11.0 → 1.12.0 |
| **MAJOR** | Cambios breaking, refactorizaciones grandes | 1.11.0 → 2.0.0 |

### Control de Versiones en Ejecutables
- Cada versión debe tener su propia carpeta `v{VERSION}`
- Nunca sobrescribir versiones anteriores
- Mantener al menos las últimas 3 versiones
- Archivar versiones antiguas en almacenamiento externo

### Configuración de electron-builder

#### Ubicación
La configuración está en `package.json` bajo la clave `build`.

#### Puntos Clave
- **appId:** `com.arkhegroup.arkhe-aula`
- **productName:** `Arkhe Aula`
- **Output:** `Ejecutables/`
- **Recursos extra:** carpeta `documentacion/`

#### Actualizaciones
- **Proveedor:** generic
- **URL:** `https://arkhegroup.com/updates/arkhe-aula/`
- **Canal:** latest

### Consideraciones Importantes

#### macOS
- Requiere firmar la aplicación para distribución
- `identity: null` para desarrollo local
- Soporta Dark Mode

#### Windows
- NSIS permite instalación personalizada
- Versión portable no requiere instalación
- Icono ubicado en `build/icon.png`

#### Post-Build
El script `scripts/post-build.js` se ejecuta automáticamente después del build para:
- Copiar recursos adicionales
- Generar documentación
- Validar integridad del build

### Solución de Problemas Comunes

#### Error: "Cannot find module"
```bash
npm install
rm -rf node_modules
npm install
```

#### Error en macOS: "identity not found"
Verificar que `identity: null` esté configurado para desarrollo.

#### Build muy lento
```bash
# Limpiar caché de Vite
rm -rf node_modules/.vite
```

#### Error de permisos en Windows
Ejecutar terminal como administrador.

---

## Skill: Diseño

### Propósito
Este skill define las convenciones, arquitectura, reglas de estilo de código, buenas prácticas y patrones de diseño específicos para el frontend de Arkhe Aula.

### Arquitectura General

#### Framework
- **Vue.js 3.5.0** con Composition API
- **TypeScript** para tipado estático
- **Vite 6.2.4** como build tool

#### Estructura de Directorios
```
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

### Convenciones de Código

#### Nomenclatura de Archivos

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes Vue | PascalCase | `UsuarioForm.vue` |
| Composables | camelCase con prefijo `use` | `useAuth.ts` |
| Stores | camelCase con sufijo `Store` | `authStore.ts` |
| Tipos/Interfaces | PascalCase | `Usuario.ts` |
| Utilidades | camelCase | `formatDate.ts` |
| Estilos | kebab-case | `variables.css` |

#### Componentes Vue

##### Estructura Base
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

### Gestión de Estado

#### Pinia Stores

##### Estructura de Store
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
</script>
```

### Estilos y Diseño

#### Tipografía
```css
/* Principal - Headers, Títulos */
font-family: 'Sans Serif', system-ui, -apple-system, sans-serif;

/* Secundaria - Cuerpo de texto */
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

#### Paleta de Colores
```css
:root {
  --color-primario: #0D1B2A;
  --color-secundario: #1B9AAA;
  --color-terciario: #E1A140;
  --color-neutro: #E0E1DD;
}
```

#### Convenciones de Estilos
- Usar **CSS scoped** en componentes Vue
- Preferir **variables CSS** para colores y espaciados
- Usar **clases utilitarias** para patrones repetitivos
- Evitar selectores anidados profundos (máximo 3 niveles)

### Patrones de Diseño

#### Componentes Presentacionales vs Contenedores
```typescript
// Presentacional (solo recibe props y emite eventos)
// components/UsuarioCard.vue

// Contenedor (maneja lógica y estado)
// pages/UsuariosPage.vue
```

#### Custom Composables
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

#### Error Handling
```typescript
try {
  await accionAsincrona()
} catch (error) {
  console.error('Error específico:', error)
  // Mostrar notificación al usuario
}
```

### Comunicación con Electron (IPC)

#### Desde Renderer
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

### Buenas Prácticas

#### Performance
- Usar `v-memo` para componentes costosos
- Implementar **lazy loading** en rutas
- Usar **virtual scrolling** para listas largas
- Evitar computadas costosas sin dependencias claras

#### Accesibilidad
- Usar atributos `aria-*` cuando sea necesario
- Asegurar contraste de colores adecuado
- Implementar navegación por teclado
- Usar etiquetas semánticas HTML

#### Seguridad
- Validar datos en frontend y backend
- Sanitizar inputs del usuario
- No almacenar datos sensibles en localStorage
- Usar HTTPS para comunicaciones externas

#### Testing
- Escribir tests unitarios para composables
- Testear stores de Pinia
- Tests E2E para flujos críticos

### Convenciones de Git

#### Commits
```
feat: agregar nueva funcionalidad
fix: corregir bug
docs: actualizar documentación
style: cambios de formato
refactor: refactorización de código
test: agregar/modificar tests
chore: cambios de configuración
```

#### Branches
```
main          # Rama principal de producción
develop       # Rama de desarrollo
feature/*     # Nuevas funcionalidades
fix/*         # Correcciones de bugs
release/*     # Preparación de releases
```

### Recursos Adicionales

#### Documentación Oficial
- [Vue.js 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Vue Router](https://router.vuejs.org/)

#### Herramientas Recomendadas
- **Volar** - Extensión de VS Code para Vue 3
- **ESLint** - Linting de código
- **Prettier** - Formateo automático

---

## Skill: Base de Datos

### Propósito
Este skill define la estructura, normalización y buenas prácticas para la base de datos SQLite de Arkhe Aula.

### Configuración Técnica

#### Motor de Base de Datos
| Propiedad | Valor |
|-----------|-------|
| **Motor** | SQLite 3 |
| **Librería** | better-sqlite3 ^8.2.0 |
| **Tipo** | Embebida (local-first) |
| **Ubicación** | Configurada en `electron/database.js` |

### Principios de Diseño

#### Normalización
La base de datos debe cumplir al menos la **Tercera Forma Normal (3NF)**:

1. **1NF:** Cada columna contiene valores atómicos
2. **2NF:** Cumple 1NF y no hay dependencias parciales
3. **3NF:** Cumple 2NF y no hay dependencias transitivas

#### Reglas de Integridad
- **Integridad de Entidad:** Primary Key única y no nula
- **Integridad Referencial:** Foreign Keys con CASCADE apropiado
- **Integridad de Dominio:** CHECK constraints para validación de datos

### Convenciones de Nomenclatura

#### Tablas
- Nombres en **plural** y **snake_case**
- Ejemplos: `usuarios`, `evaluaciones_docentes`, `grupos_estudiantes`

#### Columnas
- Nombres en **snake_case**
- Primary Key siempre llamada `id`
- Foreign Keys: `nombre_tabla_singular_id` (ej: `usuario_id`)
- Fechas: `created_at`, `updated_at`, `deleted_at` (soft delete)

#### Índices
- Patrón: `idx_nombre_tabla_columna`
- Ejemplo: `idx_usuarios_email`

### Esquema de Base de Datos

#### Tablas Principales

##### usuarios
```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'docente', 'estudiante')),
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
```

##### evaluaciones
```sql
CREATE TABLE evaluaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evaluencias_periodo ON evaluaciones(periodo_inicio, periodo_fin);
```

##### grupos
```sql
CREATE TABLE grupos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    docente_id INTEGER NOT NULL,
    periodo TEXT NOT NULL,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_grupos_docente ON grupos(docente_id);
```

##### grupos_estudiantes (Tabla intermedia)
```sql
CREATE TABLE grupos_estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id INTEGER NOT NULL,
    estudiante_id INTEGER NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(grupo_id, estudiante_id)
);

CREATE INDEX idx_grupos_estudiantes_grupo ON grupos_estudiantes(grupo_id);
CREATE INDEX idx_grupos_estudiantes_estudiante ON grupos_estudiantes(estudiante_id);
```

##### criterios_evaluacion
```sql
CREATE TABLE criterios_evaluacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluacion_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    ponderacion DECIMAL(5,2) NOT NULL CHECK (ponderacion >= 0 AND ponderacion <= 100),
    orden INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE
);

CREATE INDEX idx_criterios_evaluacion ON criterios_evaluacion(evaluacion_id);
```

##### respuestas_evaluacion
```sql
CREATE TABLE respuestas_evaluacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluacion_id INTEGER NOT NULL,
    grupo_id INTEGER NOT NULL,
    estudiante_evaluado_id INTEGER NOT NULL,
    estudiante_evaluador_id INTEGER NOT NULL,
    criterio_id INTEGER NOT NULL,
    puntaje DECIMAL(5,2) NOT NULL,
    comentarios TEXT,
    fecha_respuesta DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (estudiante_evaluado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (estudiante_evaluador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (criterio_id) REFERENCES criterios_evaluacion(id) ON DELETE CASCADE
);

CREATE INDEX idx_respuestas_evaluacion ON respuestas_evaluacion(evaluacion_id, grupo_id);
CREATE INDEX idx_respuestas_estudiante_evaluado ON respuestas_evaluacion(estudiante_evaluado_id);
```

### Operaciones CRUD

#### Configuración de better-sqlite3
```javascript
// electron/database.js
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'arkhe_aula.db'));

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Habilitar WAL mode para mejor concurrencia
db.pragma('journal_mode = WAL');

module.exports = db;
```

#### Ejemplos de Consultas

##### Insertar con transacción
```javascript
const insertarUsuario = db.transaction((usuario) => {
  const stmt = db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, rol)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(usuario.nombre, usuario.email, usuario.hash, usuario.rol);
});

insertarUsuario({
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  hash: 'hash_seguro',
  rol: 'docente'
});
```

##### Consultar con JOIN
```javascript
const obtenerGruposConDocente = db.prepare(`
  SELECT 
    g.id,
    g.nombre,
    g.periodo,
    u.nombre as docente_nombre,
    u.email as docente_email
  FROM grupos g
  INNER JOIN usuarios u ON g.docente_id = u.id
  WHERE g.activo = 1
  ORDER BY g.nombre
`).all();
```

##### Actualizar
```javascript
const actualizarUsuario = db.prepare(`
  UPDATE usuarios 
  SET nombre = ?, email = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

actualizarUsuario('Nuevo Nombre', 'nuevo@email.com', 1);
```

##### Eliminar (Soft Delete)
```javascript
const eliminarUsuario = db.prepare(`
  UPDATE usuarios 
  SET activo = 0, deleted_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

eliminarUsuario(1);
```

### Migraciones

#### Estructura de Archivos de Migración
```
electron/
└── migrations/
    ├── 001_create_usuarios.sql
    ├── 002_create_evaluaciones.sql
    ├── 003_create_grupos.sql
    └── ...
```

#### Tabla de Control de Migraciones
```sql
CREATE TABLE migraciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL,
    fecha_ejecucion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Script de Migración
```javascript
const fs = require('fs');
const path = require('path');

function ejecutarMigraciones(db) {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    const exists = db.prepare(
      'SELECT 1 FROM migraciones WHERE nombre = ?'
    ).get(file);

    if (!exists) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql);
      db.prepare('INSERT INTO migraciones (nombre) VALUES (?)').run(file);
      console.log(`Migración ejecutada: ${file}`);
    }
  }
}
```

### Buenas Prácticas

#### Performance
- Usar **índices** en columnas de búsqueda frecuente
- Usar **transacciones** para operaciones múltiples
- Habilitar **WAL mode** para concurrencia
- Usar **prepared statements** para consultas repetidas

#### Seguridad
- Usar **parámetros vinculados** para prevenir SQL injection
- Hashear contraseñas con **bcrypt** antes de almacenar
- Validar datos antes de insertar/actualizar
- Implementar **soft delete** para auditoría

#### Mantenimiento
- Ejecutar **VACUUM** periódicamente
- Monitorear tamaño de la base de datos
- Hacer **backups** automáticos
- Limpiar datos antiguos/archivados

#### Backup
```javascript
function crearBackup(db, rutaBackup) {
  const backup = db.prepare('VACUUM INTO ?').run(rutaBackup);
  console.log(`Backup creado: ${rutaBackup}`);
}
```

### Referencias de Documentación

#### Cuando Crear/Modificar Componentes
Cada vez que se cree o modifique:
1. **Tablas:** Actualizar este archivo con el esquema
2. **Migraciones:** Crear archivo SQL en `migrations/`
3. **IPC Handlers:** Actualizar `electron/ipc-handlers.js`
4. **Servicios Frontend:** Actualizar `src/services/`

#### Diagrama Entidad-Relación
Mantener actualizado el DER en la carpeta `documentacion/` con:
- Tablas y sus columnas
- Relaciones entre tablas
- Cardinalidad de relaciones

### Recursos Adicionales

#### Documentación Oficial
- [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

#### Herramientas
- **DB Browser for SQLite** - Visor y editor gráfico
- **SQLite Studio** - Administración de bases de datos

---

## Skill: Instrucciones

### Propósito
Este skill contiene las instrucciones exactas para arrancar el servidor local, instalar dependencias y configurar el entorno de desarrollo de Arkhe Aula.

### Requisitos Previos

#### Software Requerido
| Software | Versión Mínima | Propósito |
|----------|---------------|-----------|
| Node.js | 18.x | Runtime de JavaScript |
| npm | 9.x | Gestor de paquetes |
| Git | 2.x | Control de versiones |

#### Verificar Instalación
```bash
node --version    # Debe mostrar v18.x o superior
npm --version     # Debe mostrar 9.x o superior
git --version     # Debe mostrar 2.x o superior
```

### Instalación del Proyecto

#### 1. Clonar Repositorio (si aplica)
```bash
git clone <url-del-repositorio>
cd Arke_Software
```

#### 2. Instalar Dependencias
```bash
npm install
```

Este comando instalará:
- Dependencias de desarrollo (Vite, Electron, TypeScript, etc.)
- Dependencias de producción (Vue, Pinia, better-sqlite3, etc.)
- Ejecutará el script `postinstall` para dependencias de Electron

#### 3. Verificar Instalación
```bash
# Verificar que node_modules existe
ls -la node_modules

# Verificar paquetes instalados
npm list --depth=0
```

### Arrancar Servidor Local (Modo Desarrollo)

#### Opción 1: Desarrollo Completo (Recomendado)
```bash
npm run dev
```

Este comando ejecuta simultáneamente:
1. **Vite dev server** en `http://localhost:5173`
2. **Electron** cargando la aplicación de escritorio

**Proceso:**
- Vite inicia en puerto 5173
- `wait-on` espera a que Vite esté listo
- Electron se lanza automáticamente
- Hot-reload habilitado para ambos procesos

#### Opción 2: Solo Vite (Frontend)
```bash
npm run dev:vite
```
- Inicia solo el servidor de desarrollo de Vite
- Útil para desarrollar UI sin Electron
- Acceso: `http://localhost:5173`

#### Opción 3: Desarrollo con iPad/Dispositivos
```bash
npm run dev:ipad
```
- Inicia Vite con `--host` para acceso en red local
- Permite probar en dispositivos móviles/tablets
- Electron se inicia automáticamente

#### Opción 4: Solo Electron (Requiere Vite corriendo)
```bash
npm run dev:electron
```
- Solo inicia Electron (asume Vite ya está corriendo)
- Útil para reiniciar Electron sin reiniciar Vite

### Estructura de Comandos npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo completo (Vite + Electron) |
| `npm run dev:vite` | Solo Vite dev server |
| `npm run dev:ipad` | Vite con host + Electron |
| `npm run dev:electron` | Solo Electron (Vite debe estar corriendo) |
| `npm run build` | Build para Windows y macOS |
| `npm run build:win` | Build solo Windows |
| `npm run build:mac` | Build solo macOS |
| `npm run build:vite` | Build solo frontend |

### Configuración del Entorno

#### Variables de Entorno
El proyecto usa `cross-env` para variables de entorno multiplataforma.

```bash
# Desarrollo
NODE_ENV=development

# Producción
NODE_ENV=production
```

#### Configuración de Vite
Ubicación: `vite.config.ts`

```typescript
{
  server: {
    port: 5173,        // Puerto del dev server
    strictPort: true,  // Fallar si el puerto está ocupado
  },
  base: './',          // Ruta base para builds
}
```

#### Alias de Rutas
```typescript
'@/' → 'src/'
```

Uso en código:
```typescript
import Component from '@/components/Component.vue'
```

### Solución de Problemas Comunes

#### Puerto 5173 Ocupado
```bash
# Matar proceso usando el puerto
lsof -ti:5173 | xargs kill -9

# O cambiar puerto en vite.config.ts
```

#### Error: "Cannot find module 'electron'"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

#### Error en better-sqlite3
```bash
# Rebuild de dependencias nativas
npm rebuild better-sqlite3

# O reinstalar
rm -rf node_modules
npm install
```

#### Electron no se inicia
```bash
# Verificar que Vite esté corriendo
npm run dev:vite

# En otra terminal, iniciar Electron manualmente
npm run dev:electron
```

#### Error de Permisos en macOS
```bash
# Dar permisos de ejecución
chmod +x node_modules/.bin/*
```

#### Error: "asar is not a valid keyword"
```bash
# Limpiar caché de npm
npm cache clean --force
npm install
```

### Flujo de Trabajo Recomendado

#### Inicio de Jornada
```bash
# 1. Asegurarse de estar en la rama correcta
git checkout develop

# 2. Actualizar dependencias si hubo cambios
git pull
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

#### Durante el Desarrollo
- Los cambios en `src/` se reflejan automáticamente (hot-reload)
- Los cambios en `electron/` reinician Electron automáticamente
- Verificar consola de Vite y Electron para errores

#### Fin de Jornada
```bash
# 1. Guardar cambios
git add .
git commit -m "feat: descripción del cambio"

# 2. (Opcional) Push a repositorio
git push origin develop
```

### Depuración

#### DevTools de Electron
```typescript
// Habilitar DevTools en electron/main.js
mainWindow.webContents.openDevTools();
```

#### Consola de Vite
- Ver terminal donde se ejecutó `npm run dev`
- Errores de compilación aparecen aquí

#### Consola del Renderer
```typescript
// En componentes Vue
console.log('Mensaje desde renderer')
```

#### Consola del Main Process
```javascript
// En electron/main.js
console.log('Mensaje desde main process')
```

### Recursos Adicionales

#### Documentación
- [Vite](https://vitejs.dev/)
- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)

#### Herramientas Útiles
- **Vue DevTools** - Extensión de navegador para debuggear Vue
- **Electron DevTools** - Integrada en la aplicación

---

## Skill: Pruebas

### Propósito
Este skill documenta cómo correr los tests en el proyecto Arkhe Aula, incluyendo configuración, tipos de pruebas y flujos de trabajo.

### Estado Actual de Testing

#### Configuración Existente
Al revisar el proyecto, se identifica que **no hay una configuración de testing establecida** en este momento.

#### Dependencias de Testing Recomendadas
Para implementar un sistema completo de pruebas, se recomienda instalar:

```bash
# Testing Framework (Vitest - compatible con Vite)
npm install -D vitest @vitest/ui

# Testing Library para Vue
npm install -D @testing-library/vue @testing-library/jest-dom

# Mock para Electron
npm install -D electron-mock

# Coverage
npm install -D @vitest/coverage-v8
```

### Tipos de Pruebas

#### 1. Tests Unitarios
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

#### 2. Tests de Componentes
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

#### 3. Tests de Stores (Pinia)
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

#### 4. Tests de Integración
Prueban la interacción entre múltiples componentes/módulos.

**Ubicación:** `tests/integration/**/*.test.ts`

#### 5. Tests E2E (End-to-End)
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

### Configuración Recomendada

#### vitest.config.ts
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

#### tests/setup.ts
```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

config.global.plugins = [createPinia()]
```

#### package.json (scripts)
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

### Comandos para Correr Tests

#### Una Vez Configurado

| Comando | Descripción |
|---------|-------------|
| `npm run test` | Correr tests en modo watch (desarrollo) |
| `npm run test:run` | Correr tests una vez (CI/CD) |
| `npm run test:ui` | Correr tests con interfaz gráfica |
| `npm run test:coverage` | Correr tests con reporte de cobertura |
| `npm run test:e2e` | Correr tests end-to-end |

#### Ejecutar Tests Específicos
```bash
# Test específico por nombre
npm run test -- --testNamePattern="formatDate"

# Test específico por archivo
npm run test -- src/utils/formatDate.test.ts

# Tests en modo watch con filtro
npm run test -- --watch --grep="auth"
```

### Flujo de Trabajo de Testing

#### Desarrollo con TDD
```bash
# 1. Iniciar tests en modo watch
npm run test

# 2. Escribir test (falla)
# 3. Implementar código (pasa)
# 4. Refactorizar
```

#### Antes de Commit
```bash
# Correr todos los tests
npm run test:run

# Verificar cobertura
npm run test:coverage
```

#### CI/CD Pipeline
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

### Testing de IPC (Electron)

#### Mock de IPC en Tests
```typescript
// __mocks__/electron.ts
export const ipcRenderer = {
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
}
```

#### Test de Servicios IPC
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

### Buenas Prácticas

#### Naming de Tests
```typescript
describe('nombreDelComponenteOFuncion', () => {
  it('debe hacer algo cuando algo', () => {
    // Test
  })
})
```

#### Arrange-Act-Assert
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

#### Cobertura Mínima Recomendada
- **Statements:** 80%
- **Branches:** 70%
- **Functions:** 80%
- **Lines:** 80%

### Recursos Adicionales

#### Documentación
- [Vitest](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

#### Herramientas
- **Vitest UI** - Interfaz gráfica para Vitest
- **Playwright Inspector** - Debug de tests E2E

---

# CONTEXTO HISTÓRICO

> **Importante:** Esta sección debe consultarse para conocer decisiones previas, bugs resueltos y soluciones implementadas.

---

## Histórico de Contexto - 2026-03-13

### Fecha: 13 de Marzo, 2026

---

### Componente Creado: Sistema de Agente IA

#### Descripción
Se creó la estructura completa del sistema de agente IA para el proyecto Arkhe Aula, incluyendo:

1. **Carpeta AgenteIA/** - Contenedor principal de toda la documentación del agente
2. **archivo agente.md** - Documento principal con:
   - Información del proyecto (nombre, empresa, versión)
   - Idioma de comunicación (Español)
   - Rol del agente (Arquitecto de Software Senior y experto en BD)
   - Identidad visual (tipografía, colores, iconografía)
   - Stack tecnológico completo
   - Referencias a skills disponibles

3. **Skills creados en AgenteIA/skills/**:
   - `compila.md` - Instrucciones de build y construcción
   - `diseño.md` - Convenciones y arquitectura del frontend
   - `basededatos.md` - Estructura y normalización de la BD
   - `instrucciones.md` - Cómo arrancar servidor e instalar dependencias
   - `pruebas.md` - Cómo correr tests en el proyecto

4. **Carpeta contexto/** - Para documentación de bugs y soluciones futuras

5. **Carpeta iconos/** - Para recursos de iconografía del sistema

#### Decisiones de Diseño

##### Estructura de Carpetas
```
AgenteIA/
├── agente.md           # Documento principal
├── skills/             # Skills especializados
│   ├── compila.md
│   ├── diseño.md
│   ├── basededatos.md
│   ├── instrucciones.md
│   └── pruebas.md
└── contexto/           # Memoria de contexto (bugs, soluciones)
```

##### Identidad Visual Definida
- **Tipografía Principal:** Sans Serif (headers, títulos)
- **Tipografía Secundaria:** Inter (cuerpo de texto)
- **Paleta de Colores:**
  - `#0D1B2A` - Primario (fondos oscuros)
  - `#1B9AAA` - Secundario (botones, enlaces)
  - `#E1A140` - Terciario (alertas, destacados)
  - `#E0E1DD` - Neutro (fondos claros)

##### Base de Datos
- **Motor:** SQLite con better-sqlite3 ^8.2.0
- **Tipo:** Embebida (local-first)
- **Normalización:** 3NF mínima requerida
- **Convenciones:** snake_case, plural para tablas

##### Tecnologías Confirmadas

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Vue.js | ^3.5.0 |
| Build Tool | Vite | ^6.2.4 |
| Desktop | Electron | ^22.3.27 |
| Estado | Pinia | ^3.0.1 |
| Router | Vue Router | ^4.5.0 |
| BD | better-sqlite3 | ^8.2.0 |
| Lenguaje | TypeScript | ^5.8.2 |

##### Comandos de Desarrollo
```bash
# Instalación
npm install

# Desarrollo
npm run dev

# Build
npm run build
npm run build:win
npm run build:mac
```

##### Notas Importantes
1. La comunicación IA-programador es **exclusivamente en español**
2. Todos los iconos deben tomarse de la carpeta `iconos/`
3. Cada build debe consultar el skill `compila.md`
4. El frontend se rige por `diseño.md`
5. La BD debe estar normalizada según `basededatos.md`
6. Todo bug/solución debe documentarse en `contexto/`

---

### Próximos Pasos Sugeridos

1. **Implementar testing:** Instalar Vitest y configurar según `pruebas.md`
2. **Documentar esquema actual:** Completar `basededatos.md` con el esquema real de la BD
3. **Agregar iconos:** Poblar carpeta `iconos/` con los recursos del sistema
4. **Configurar CI/CD:** Implementar pipeline de tests y builds automáticos

---

## Notas Importantes del Proyecto

1. La aplicación es **local-first**, usando SQLite como almacenamiento principal.
2. La comunicación entre renderer y main process se realiza mediante **IPC**.
3. El proyecto soporta modo desarrollo con hot-reload para Vite y Electron.
4. Cada actualización o construcción debe consultar el skill `compila.md`.
5. El frontend debe regirse por las convenciones en `diseño.md`.
6. La base de datos debe estar normalizada según `basededatos.md`.
7. Todo bug o solución importante debe documentarse en `contexto/`.
8. **Cuando se solicite leer este archivo, también debe leerse el contenido completo de `AgenteIA/skills/` y `AgenteIA/contexto/`**

---

## ⚠️ Recordatorio de Flujo de Trabajo Obligatorio

### Después de Cada Corrección, Actualización o Cambio en el Sistema

**IMPORTANTE:** Después de realizar cualquier modificación al código (bug fixes, nuevas funcionalidades, refactorizaciones, etc.), **DEBES** seguir este flujo:

#### 1. **Consultar Skill: Compila** (`AgenteIA/skills/compila.md`)
- Revisar el flujo de trabajo para nueva versión
- Aplicar versionado semántico (SemVer): PATCH, MINOR o MAJOR
- Seguir las buenas prácticas de compilación

#### 2. **Actualizar Versión** (si aplica)
```bash
# Patch (1.11.0 -> 1.11.1) - Bug fixes
npm version patch

# Minor (1.11.0 -> 1.12.0) - Nuevas funcionalidades
npm version minor

# Major (1.11.0 -> 2.0.0) - Cambios breaking
npm version major
```

#### 3. **Ejecutar Build**
```bash
# Build completo
npm run build

# O build específico por plataforma
npm run build:win
npm run build:mac
```

#### 4. **Organizar por Versión**
- Los ejecutables se guardan en `Ejecutables/v{VERSION}/`
- Nunca sobrescribir versiones anteriores

#### 5. **Documentar en Contexto**
- Crear/actualizar archivo en `AgenteIA/contexto/`
- Incluir fecha, descripción del cambio y archivos modificados
- Registrar en el log de transacciones

#### 6. **Subir al Servidor** (si es release)
- Seguir instrucciones en `compila.md` → "Subida al Servidor de Actualizaciones"
- Subir manifiestos y ejecutables
- Verificar actualización

---

### Flujo Resumido

```
CORRECCIÓN/ACTUALIZACIÓN
    ↓
CONSULTAR compila.md
    ↓
ACTUALIZAR VERSIÓN (npm version)
    ↓
EJECUTAR BUILD (npm run build)
    ↓
DOCUMENTAR EN contexto/
    ↓
LOG EN log/transactions_*.log
    ↓
SUBIR AL SERVIDOR (si es release)
```

---

*Documento unificado creado el 13 de Marzo, 2026 - Arkhe Systems*
*Última actualización: 13 de Marzo, 2026 - Agregado recordatorio de flujo de trabajo*
