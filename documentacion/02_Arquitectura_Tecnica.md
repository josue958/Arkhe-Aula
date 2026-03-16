# Arkhe Aula — Arquitectura Técnica

## 1. Stack Tecnológico

### Lenguajes de Programación

| Lenguaje | Versión | Propósito |
|----------|---------|-----------|
| **TypeScript** | ^5.8.2 | Lógica principal, tipado estático |
| **JavaScript** | ES2020 | Scripts de configuración y utilidades |
| **Vue Template** | 3.5.0 | Templates de componentes Vue |

### Frameworks y Librerías Principales

| Framework/Librería | Versión | Propósito |
|-------------------|---------|-----------|
| **Vue.js** | ^3.5.0 | Framework frontend (Composition API) |
| **Vite** | ^6.2.4 | Build tool y dev server |
| **Electron** | ^22.3.27 | Framework para aplicaciones de escritorio |
| **Pinia** | ^3.0.1 | Gestión de estado global |
| **Vue Router** | ^4.5.0 | Enrutamiento entre vistas |
| **VueDraggable** | ^4.1.0 | Funcionalidad drag & drop |
| **@vueuse/core** | ^12.7.0 | Utilidades composables para Vue |

### Base de Datos

| Base de Datos | Versión | Tipo | Uso |
|--------------|---------|------|-----|
| **better-sqlite3** | ^8.2.0 | SQLite embebida | Almacenamiento local (local-first) |

**Ubicación del archivo de configuración:** `electron/database.js`

**Características:**
- Base de datos SQLite local en cada instalación
- Archivo único `.db` portable
- Soporte para migraciones
- Backups automáticos programados
- Sincronización opcional con la nube

### Librerías de Utilidad

| Librería | Versión | Propósito |
|----------|---------|-----------|
| **bcryptjs** | ^3.0.2 | Encriptación de contraseñas |
| **docx** | ^9.6.0 | Generación de documentos Word |
| **exceljs** | ^4.4.0 | Manipulación avanzada de Excel |
| **xlsx** | ^0.18.5 | Exportación rápida a Excel |
| **qrcode** | ^1.5.4 | Generación de códigos QR |
| **file-saver** | ^2.0.5 | Descarga de archivos en navegador |
| **electron-updater** | ^6.8.3 | Actualizaciones automáticas |

### Herramientas de Desarrollo

| Herramienta | Versión | Propósito |
|------------|---------|-----------|
| **@vitejs/plugin-vue** | ^5.2.4 | Plugin Vue para Vite |
| **vite-plugin-pwa** | ^1.2.0 | Soporte para Progressive Web App |
| **vite-plugin-electron** | ^0.29.0 | Integración Electron con Vite |
| **electron-builder** | ^24.13.3 | Empaquetado y distribución |
| **vue-tsc** | ^2.2.8 | Type checking para Vue |
| **vitest** | ^4.1.0 | Framework de testing |
| **concurrently** | ^9.1.2 | Ejecución paralela de comandos |

---

## 2. Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Arkhe Aula                              │
│                    Aplicación de Escritorio                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Capa de Presentación                   │   │
│  │                    (Vue.js Frontend)                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │
│  │  │Components│  │  Pages   │  │ Layouts  │  │  Stores  │    │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕ IPC                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Capa de Backend                        │   │
│  │                   (Electron Main)                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ IPC Handlers │  │  Database    │  │   Sync       │   │   │
│  │  │              │  │  Controller  │  │   Manager    │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Capa de Datos                          │   │
│  │                   (SQLite Local)                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  arkhe_software.db (archivo local)               │    │   │
│  │  │  - Tablas normalizadas (3NF)                     │    │   │
│  │  │  - Índices optimizados                           │    │   │
│  │  │  - Migraciones versionadas                       │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (opcional)
┌─────────────────────────────────────────────────────────────────┐
│                    Servicios Externos                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Firebase   │  │   CloudKit   │  │   OneDrive   │          │
│  │   (Google)   │  │   (Apple)    │  │   (Microsoft)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de Directorios

```
arkhe-aula/
├── src/                      # Código Vue.js (frontend)
│   ├── assets/               # Recursos estáticos
│   ├── components/           # Componentes reutilizables
│   ├── layouts/              # Layouts principales
│   ├── pages/                # Vistas/páginas
│   ├── router/               # Configuración de rutas
│   ├── services/             # Servicios y llamadas IPC
│   ├── stores/               # Stores de Pinia
│   ├── types/                # Tipos TypeScript
│   ├── utils/                # Utilidades y helpers
│   ├── App.vue               # Componente raíz
│   └── main.ts               # Punto de entrada
│
├── electron/                 # Código Electron (backend)
│   ├── database.js           # Configuración de SQLite
│   ├── main.js               # Proceso principal
│   ├── preload.js            # Script de preload
│   ├── ipc-handlers.js       # Manejadores IPC
│   ├── updater.js            # Actualizaciones automáticas
│   ├── sync/                 # Módulo de sincronización
│   └── logger.js             # Sistema de logging
│
├── scripts/                  # Scripts de build y utilidades
│   ├── post-build.js         # Post-procesamiento de build
│   ├── upload-latest.js      # Subida al servidor
│   └── verify-updates.js     # Verificación de actualizaciones
│
├── documentacion/            # Documentación del proyecto
├── AgenteIA/                 # Documentación del agente IA
├── iconos/                   # Recursos de iconografía
├── build/                    # Recursos de build (iconos)
├── dist/                     # Output de Vite (build)
├── Ejecutables/              # Aplicaciones compiladas
│   └── v{VERSION}/           # Versiones por release
│
├── package.json              # Configuración del proyecto
├── vite.config.ts            # Configuración de Vite
├── tsconfig.json             # Configuración de TypeScript
└── agente.md                 # Documento principal del agente
```

---

## 3. Base de Datos

### Esquema de Base de Datos

#### Tablas Principales

**usuarios** — Gestión de usuarios del sistema
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
```

**grupos** — Grupos escolares
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
```

**estudiantes** — Alumnos inscritos
```sql
CREATE TABLE estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    paternal_surname TEXT NOT NULL,
    maternal_surname TEXT NOT NULL,
    grupo_id INTEGER NOT NULL,
    student_status_id INTEGER,
    enrolled_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);
```

**asistencias** — Registro diario de asistencia
```sql
CREATE TABLE asistencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    UNIQUE(estudiante_id, fecha)
);
```

**evaluacion_rubrics** — Rúbricas de evaluación
```sql
CREATE TABLE evaluacion_rubrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    period_id INTEGER NOT NULL,
    is_extra BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);
```

**activities** — Actividades de evaluación
```sql
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rubric_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    period_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rubric_id) REFERENCES evaluacion_rubrics(id) ON DELETE CASCADE
);
```

**grades** — Calificaciones de alumnos
```sql
CREATE TABLE grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE(student_id, activity_id)
);
```

**teams** — Equipos de trabajo
```sql
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    team_number INTEGER NOT NULL,
    topic TEXT,
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    UNIQUE(activity_id, student_id)
);
```

**incidentes** — Incidentes disciplinarios
```sql
CREATE TABLE incidentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    tipo_incidente_id INTEGER,
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    gravedad TEXT CHECK (gravedad IN ('leve', 'grave', 'muy_grave')),
    acciones_tomadas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);
```

**pdas** — Proyectos de Aula (Planeación didáctica)
```sql
CREATE TABLE pdas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id INTEGER NOT NULL,
    materia_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    sesiones INTEGER DEFAULT 1,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES subjects(id) ON DELETE CASCADE
);
```

### Migraciones

Las migraciones se almacenan en `electron/migrations/` y se ejecutan automáticamente al iniciar la aplicación.

**Ejemplo de migración:**
```sql
-- 001_create_usuarios.sql
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
```

---

## 4. Comunicación entre Procesos (IPC)

### Arquitectura IPC de Electron

```
┌─────────────────┐                    ┌─────────────────┐
│   Renderer      │                    │     Main        │
│   (Vue.js)      │                    │   (Node.js)     │
│                 │                    │                 │
│  window.electron│ ─────invoke──────▶ │  ipcMain.handle │
│     .api        │    (promises)      │                 │
│                 │                    │                 │
│  ipcRenderer    │ ◀─────send──────── │  ipcMain.emit   │
│     .on         │    (events)        │                 │
└─────────────────┘                    └─────────────────┘
```

### Handlers IPC Principales

| Handler | Método | Descripción |
|---------|--------|-------------|
| `auth-login` | invoke | Autenticación de usuarios |
| `groups-get` | invoke | Obtener lista de grupos |
| `students-get-by-group` | invoke | Obtener alumnos por grupo |
| `attendance-save` | invoke | Guardar registro de asistencia |
| `grades-save` | invoke | Guardar calificaciones |
| `teams-save` | invoke | Guardar configuración de equipos |
| `reports-get-data` | invoke | Obtener datos para reportes |
| `export-to-excel` | invoke | Exportar datos a Excel |
| `export-to-pdf` | invoke | Exportar datos a PDF |
| `db-export` | invoke | Exportar base de datos |
| `db-import` | invoke | Importar base de datos |
| `sync-push` | invoke | Sincronizar con la nube |
| `sync-pull` | invoke | Descargar desde la nube |

---

## 5. Múltiples Grupos y Docentes

### Soporte Multi-grupo

✅ **Sí soporta múltiples grupos**

- Ilimitados grupos por docente
- Organización por ciclo escolar
- Filtrado por trimestre
- Migración de grupos entre ciclos

### Soporte Multi-docente

✅ **Sí soporta múltiples docentes**

- Sistema de roles (admin, docente)
- Cada docente ve solo sus grupos
- Administrador puede ver todos los grupos
- Perfiles de usuario independientes

### Estructura de Datos Multi-tenant

```
Ciclo Escolar (2025-2026)
├── Docente 1
│   ├── Grupo 1A
│   │   ├── Alumnos (30)
│   │   ├── Materias (6)
│   │   └── Evaluaciones
│   └── Grupo 1B
│       └── ...
├── Docente 2
│   ├── Grupo 2A
│   └── ...
└── Docente N
    └── ...
```

---

## 6. Exportación de Datos

### Formatos Soportados

| Formato | Librería | Uso |
|---------|----------|-----|
| **Excel (.xlsx)** | exceljs, xlsx | Calificaciones, asistencias, listas |
| **PDF** | Generación nativa | Reportes oficiales, boletas |
| **Word (.docx)** | docx | Cartas, oficios, reportes narrativos |
| **SQLite (.db)** | better-sqlite3 | Respaldo completo de base de datos |
| **JSON** | Nativo | Exportación de perfil, configuración |

### Ejemplos de Exportación

#### Exportar Calificaciones a Excel
```typescript
import { exportGradesToExcel } from '@/utils/excelExport'

await exportGradesToExcel({
  groupId: 1,
  subjectId: 5,
  trimester: 1,
  includeAverages: true,
  includeAttendance: true
})
```

#### Exportar Reporte de Asistencia a PDF
```typescript
import { exportAttendanceToPDF } from '@/utils/pdfExport'

await exportAttendanceToPDF({
  groupId: 1,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  includeSummary: true
})
```

#### Respaldo de Base de Datos
```typescript
// Exportación completa
const result = await window.electronAPI.exportDatabase('/path/to/backup.db')
// result.success === true si fue exitoso
```

---

## 7. Instalación y Distribución

### Métodos de Instalación

#### Windows

**Instalador NSIS (Recomendado)**
```
Arkhe Aula Setup 1.12.7.exe
- Instalación guiada paso a paso
- Crea accesos directos
- Permite elegir ubicación
- Incluye desinstalador
```

**Versión Portable**
```
Arkhe Aula-Portable-1.12.7.exe
- No requiere instalación
- Ejecutable único
- Ideal para USB
- Mismo funcionamiento que instalador
```

#### macOS

**DMG (Recomendado)**
```
Arkhe Aula-1.12.7.dmg
- Arrastrar a Aplicaciones
- Soporta Intel y Apple Silicon
- Firma de código opcional
```

**ZIP**
```
Arkhe Aula-1.12.7-mac.zip
- Descomprimir y ejecutar
- Portable
- Sin instalación
```

### Proceso de Instalación (Windows)

1. Descargar `Arkhe Aula Setup 1.12.7.exe`
2. Ejecutar instalador
3. Aceptar términos de licencia
4. Elegir carpeta de instalación (por defecto: `C:\Program Files\Arkhe Aula`)
5. Crear accesos directos (opcional)
6. Completar instalación
7. Ejecutar desde menú Inicio o escritorio

### Requisitos de Instalación

| Requisito | Valor |
|-----------|-------|
| Espacio en disco | 500 MB mínimos |
| Permisos de admin | Requeridos para instalación |
| .NET Framework | Incluido con Electron |
| Antivirus | Posible excepción requerida |

### Actualizaciones Automáticas

El sistema verifica actualizaciones al iniciar:

1. Consulta `latest.yml` en el servidor
2. Compara versión local con remota
3. Si hay nueva versión, notifica al usuario
4. Descarga en segundo plano
5. Instala al reiniciar la aplicación

**Configuración:**
- Automático: Verifica al iniciar (opcional)
- Manual: Menú Perfil → Buscar actualizaciones

---

## 8. Seguridad

### Autenticación

- Contraseñas encriptadas con **bcryptjs**
- Sesiones locales seguras
- Cierre automático por inactividad (opcional)
- Múltiples usuarios por instalación

### Protección de Datos

- Base de datos local (sin exposición a internet)
- Respaldo automático programado
- Exportación/importación segura
- Sin datos en la nube (a menos que se active sync)

### Permisos

| Función | Permiso Requerido |
|---------|-------------------|
| Instalación | Administrador |
| Respaldo en USB | Acceso a dispositivos |
| Actualizaciones | Conexión a internet |
| Sincronización | Cuenta de nube |

---

## 9. Rendimiento

### Métricas Típicas

| Métrica | Valor |
|---------|-------|
| Tiempo de inicio | < 3 segundos |
| Uso de RAM | 150-250 MB |
| Tamaño de BD (1000 alumnos) | ~50 MB |
| Exportación Excel (100 rows) | < 2 segundos |
| Búsqueda de alumno | < 100 ms |

### Optimizaciones Implementadas

- Índices en columnas de búsqueda frecuente
- Lazy loading de rutas Vue
- Virtual scrolling para listas largas
- Caché de consultas SQL
- Debounce en búsquedas

---

*Documento técnico de Arkhe Aula v1.12.7 — Arkhe Group © 2026*
