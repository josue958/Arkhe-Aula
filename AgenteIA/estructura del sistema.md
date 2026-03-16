# Estructura del Sistema - Arkhe Aula

## Información General

| Campo | Valor |
|-------|-------|
| **Sistema** | Arkhe Aula |
| **Empresa** | Arkhe Systems |
| **Tipo** | Aplicación de Escritorio (Electron) |
| **Versión Actual** | 1.11.0 |
| **Arquitectura** | Frontend (Vue 3) + Backend Local (Electron + SQLite) |

---

## Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     ELECTRON (Main Process)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  IPC         │  │  Database     │  │  Updater        │   │
│  │  Handlers    │  │  Manager      │  │  (auto-updates) │   │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────┘   │
│         │                 │                                  │
│         └────────┬────────┘                                  │
│                  │                                           │
│         ┌────────▼────────┐                                  │
│         │  Better-SQLite3 │                                  │
│         │  (arke_software.db)                               │
│         └─────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                    IPC Bridge (invoke/send)
                            │
┌─────────────────────────────────────────────────────────────┐
│              VUE 3 (Renderer Process)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Components  │  │  Pages        │  │  Stores (Pinia) │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Router      │  │  Services     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura de Directorios

```
Arke_Software/
├── src/                          # FRONTEND (Vue 3 + TypeScript)
│   ├── assets/                   # Recursos estáticos
│   │   └── logo.png
│   ├── components/               # Componentes reutilizables
│   │   └── ToastContainer.vue    # Notificaciones toast
│   ├── layouts/                  # Layouts principales
│   │   └── AppLayout.vue         # Layout con sidebar y topbar
│   ├── pages/                    # Vistas/Páginas de la aplicación
│   │   ├── admin/                # Módulo de Administración
│   │   │   └── AdminPage.vue
│   │   ├── attendance/           # Módulo de Asistencia
│   │   │   ├── AttendancePage.vue
│   │   │   ├── TakeAttendancePage.vue
│   │   │   └── AttendanceReportPage.vue
│   │   ├── auth/                 # Módulo de Autenticación
│   │   │   └── LoginPage.vue
│   │   ├── behavior/             # Módulo de Conducta
│   │   │   ├── BehaviorGroupsPage.vue
│   │   │   └── BehaviorTrackingPage.vue
│   │   ├── evaluation/           # Módulo de Evaluación
│   │   │   ├── EvaluationPage.vue
│   │   │   ├── SubjectsPage.vue
│   │   │   └── GradesPage.vue
│   │   ├── groups/               # Módulo de Grupos
│   │   │   └── GroupsPage.vue
│   │   ├── incidents/            # Módulo de Incidentes
│   │   │   ├── IncidentsPage.vue
│   │   │   └── CreateIncidentPage.vue
│   │   ├── planning/             # Módulo de Planeación (PDA)
│   │   │   └── PlanningPage.vue
│   │   ├── reports/              # Módulo de Reportes
│   │   │   └── ReportsPage.vue
│   │   ├── settings/             # Módulo de Configuración
│   │   │   └── SettingsPage.vue
│   │   ├── students/             # Módulo de Alumnos
│   │   │   ├── StudentsPage.vue
│   │   │   └── StudentGradesDetailPage.vue
│   │   ├── teams/                # Módulo de Equipos
│   │   │   └── TeamsPage.vue
│   │   ├── DashboardPage.vue     # Dashboard principal
│   │   └── ProfilePage.vue       # Perfil de usuario
│   ├── router/                   # Configuración de rutas
│   │   └── index.ts
│   ├── services/                 # Servicios y llamadas IPC
│   ├── stores/                   # Stores de Pinia
│   │   ├── auth.ts               # Autenticación
│   │   ├── toast.ts              # Notificaciones
│   │   └── unsaved.ts            # Cambios sin guardar
│   ├── types/                    # Tipos TypeScript
│   ├── utils/                    # Utilidades
│   ├── App.vue                   # Componente raíz
│   └── main.ts                   # Punto de entrada
│
├── electron/                     # BACKEND (Electron Main Process)
│   ├── sync/                     # Sincronización con la nube
│   ├── database.js               # Configuración de SQLite
│   ├── ipc-handlers.js           # Manejadores IPC
│   ├── main.js                   # Proceso principal
│   ├── preload.js                # Script de preload (bridge)
│   └── updater.js                # Actualizaciones automáticas
│
├── AgenteIA/                     # Documentación del Agente
│   ├── agente.md                 # Documento principal (respaldo)
│   ├── skills/                   # Skills especializados
│   │   ├── compilador.md
│   │   ├── frontend.md
│   │   ├── basededatos.md
│   │   ├── instrucciones.md
│   │   └── pruebas.md
│   ├── contexto/                 # Histórico de bugs/soluciones
│   └── estructura del sistema.md # ESTE ARCHIVO
│
├── iconos/                       # Recursos de iconografía
├── build/                        # Recursos de build (iconos, etc.)
├── dist/                         # Output de Vite (build frontend)
├── Ejecutables/                  # Output de electron-builder
│   ├── v1.11.0/                  # Versión 1.11.0
│   └── ...
├── documentacion/                # Documentación del sistema
├── scripts/                      # Scripts de build y utilidades
├── index.html                    # HTML principal
├── package.json                  # Dependencias y scripts
├── vite.config.ts                # Configuración de Vite
├── tsconfig.json                 # Configuración de TypeScript
└── agente.md                     # Documento unificado principal
```

---

## Módulos del Sistema

### 1. Módulo de Autenticación (`/auth`)
**Propósito:** Gestión de sesiones de usuarios

**Componentes:**
- `LoginPage.vue` - Formulario de login

**Funcionalidades:**
- Login con email y contraseña
- Hash de contraseñas con bcrypt
- Sesión persistente
- Roles: admin, teacher

**Rutas:**
- `/login` - Página de login

---

### 2. Módulo de Grupos (`/groups`)
**Propósito:** Gestión de grupos escolares

**Componentes:**
- `GroupsPage.vue` - Listado y gestión de grupos

**Funcionalidades:**
- Crear grupos (nombre, grado, ciclo, turno)
- Editar grupos
- Archivar/Restaurar grupos
- Eliminar grupos
- Migrar grupos entre ciclos
- Asignar materias a grupos
- Gestionar trimestres por grupo

**Rutas:**
- `/groups` - Listado de grupos

**Diseño de Referencia:** Este módulo establece el patrón de diseño para toda la aplicación.

---

### 3. Módulo de Alumnos (`/students`)
**Propósito:** Gestión de estudiantes por grupo

**Componentes:**
- `StudentsPage.vue` - Listado de alumnos
- `StudentGradesDetailPage.vue` - Detalle de calificaciones

**Funcionalidades:**
- Listar alumnos de un grupo
- Agregar alumnos manualmente
- Importar alumnos desde CSV/Excel
- Editar datos de alumnos
- Cambiar estatus (activo, baja, traslado)
- Ver historial de calificaciones
- Reordenar lista de alumnos

**Rutas:**
- `/groups/:groupId/students` - Alumnos de un grupo
- `/students/:studentId/grades` - Calificaciones de un alumno

---

### 4. Módulo de Asistencia (`/attendance`)
**Propósito:** Registro y reporte de asistencias

**Componentes:**
- `AttendancePage.vue` - Selección de grupo y fecha
- `TakeAttendancePage.vue` - Toma de asistencia
- `AttendanceReportPage.vue` - Reportes de asistencia

**Funcionalidades:**
- Registrar asistencia por grupo
- Marcar: presente, ausente, tarde
- Ver historial de asistencias
- Generar reportes por periodo
- Exportar reportes a Excel

**Rutas:**
- `/attendance` - Tomar asistencia
- `/attendance/:groupId/take` - Tomar asistencia de un grupo
- `/attendance/report` - Reportes de asistencia

---

### 5. Módulo de Evaluación (`/evaluation`)
**Propósito:** Gestión de calificaciones y rúbricas

**Componentes:**
- `EvaluationPage.vue` - Vista general de evaluaciones
- `SubjectsPage.vue` - Gestión de materias por grupo
- `GradesPage.vue` - Captura de calificaciones

**Funcionalidades:**
- Gestionar materias por grupo
- Crear rúbricas de evaluación
- Definir actividades por rúbrica
- Capturar calificaciones por alumno
- Trabajo en equipos
- Cálculo automático de promedios
- Semáforo de desempeño
- Exportar calificaciones a Excel

**Rutas:**
- `/evaluation` - Evaluaciones
- `/evaluation/:groupId/subjects` - Materias de un grupo
- `/evaluation/:groupId/subjects/:subjectId` - Calificaciones de una materia

---

### 6. Módulo de Conducta (`/behavior`)
**Propósito:** Registro de comportamiento estudiantil

**Componentes:**
- `BehaviorGroupsPage.vue` - Selección de grupo
- `BehaviorTrackingPage.vue` - Registro de conducta

**Funcionalidades:**
- Registrar comportamiento por alumno
- Tipos: bueno, neutral, malo
- Observaciones detalladas
- Historial de conducta
- Reportes por periodo

**Rutas:**
- `/behavior` - Conducta
- `/behavior/:groupId/track` - Registrar conducta de un grupo

---

### 7. Módulo de Seguimiento PDA (`/planning`)
**Propósito:** Planeación didáctica y seguimiento de PDA

**Componentes:**
- `PlanningPage.vue` - Gestión de planeaciones

**Funcionalidades:**
- Crear planeaciones por tema
- Asignar a múltiples grupos
- Registrar sesiones
- Observaciones por sesión
- Seguimiento temporal

**Rutas:**
- `/planning` - Planeaciones

---

### 8. Módulo de Equipos (`/teams`)
**Propósito:** Gestión de equipos de trabajo

**Componentes:**
- `TeamsPage.vue` - Administración de equipos

**Funcionalidades:**
- Crear equipos por actividad
- Asignar alumnos a equipos
- Evaluar equipos
- Comentarios por equipo

**Rutas:**
- `/teams` - Equipos

---

### 9. Módulo de Incidentes (`/incidents`)
**Propósito:** Registro de incidentes escolares

**Componentes:**
- `IncidentsPage.vue` - Listado de incidentes
- `CreateIncidentPage.vue` - Crear incidente

**Funcionalidades:**
- Registrar incidentes por alumno
- Tipos de incidente
- Contacto con tutores
- Notificación a autoridades
- Generar reportes oficiales

**Rutas:**
- `/incidents` - Incidentes
- `/incidents/create` - Crear incidente

---

### 10. Módulo de Reportes (`/reports`)
**Propósito:** Generación de reportes y estadísticas

**Componentes:**
- `ReportsPage.vue` - Centro de reportes

**Funcionalidades:**
- Reportes de calificaciones
- Reportes de asistencia
- Reportes de conducta
- Estadísticas de grupo
- Exportar a Excel/PDF/Word

**Rutas:**
- `/reports` - Reportes

---

### 11. Módulo de Configuración (`/settings`)
**Propósito:** Configuración general del sistema

**Componentes:**
- `SettingsPage.vue` - Panel de configuración

**Funcionalidades:**
- Configuración de escuela
- Ciclos escolares
- Trimestres
- Materias
- Estatus de alumnos
- Indicadores de desempeño
- Backup de base de datos
- Sincronización en la nube

**Rutas:**
- `/settings` - Configuración

---

### 12. Módulo de Administración (`/admin`)
**Propósito:** Administración de usuarios (solo admin)

**Componentes:**
- `AdminPage.vue` - Gestión de usuarios

**Funcionalidades:**
- Crear usuarios
- Editar usuarios
- Eliminar usuarios
- Asignar roles
- Ver logs de actividad

**Rutas:**
- `/admin` - Administración (requiere rol admin)

---

### 13. Dashboard (`/`)
**Propósito:** Vista general del sistema

**Componentes:**
- `DashboardPage.vue` - Dashboard principal

**Funcionalidades:**
- Resumen de grupos
- Resumen de alumnos
- Accesos directos
- Estadísticas generales

**Rutas:**
- `/` - Dashboard

---

### 14. Perfil (`/profile`)
**Propósito:** Gestión de perfil de usuario

**Componentes:**
- `ProfilePage.vue` - Perfil de usuario

**Funcionalidades:**
- Ver datos de usuario
- Cambiar contraseña
- Preferencias de usuario

**Rutas:**
- `/profile` - Perfil

---

## Layout Principal

### AppLayout.vue

**Estructura:**
```
┌────────────────────────────────────────────┐
│  Topbar                                    │
│  [☰]                    [👤 Usuario]       │
├──────────┬─────────────────────────────────┤
│ Sidebar  │  Main Content                   │
│          │                                 │
│ [📊] Dashboard                             │
│ [🏫] Grupos                                │
│ [✅] Asistencia                            │
│ [📋] Seguimiento PDA                       │
│ [📝] Evaluación                            │
│ [🎭] Conducta                              │
│ [🧑‍🤝‍🧑] Equipos                          │
│ [⚠️] Incidentes                            │
│ [📈] Reportes                              │
│ [⚙️] Configuración                         │
│ ──────────────────                         │
│ [👤 Admin]  (solo admin)                   │
│ ──────────────────                         │
│ [👤 Usuario]                               │
│ [🚪 Salir]                                 │
└──────────┴─────────────────────────────────┘
```

**Características:**
- Sidebar colapsable
- Navegación personalizable (drag & drop)
- Topbar con breadcrumb
- Backup automático cada 10 minutos
- Detección de cambios sin guardar

---

## Flujo de Navegación

```
Login → Dashboard
    │
    ├─→ Grupos → Alumnos → Calificaciones
    │       ├─→ Evaluación → Materias → Captura
    │       ├─→ Asistencia → Tomar → Reporte
    │       └─→ Conducta → Registro
    │
    ├─→ Seguimiento PDA
    ├─→ Equipos
    ├─→ Incidentes
    ├─→ Reportes
    ├─→ Configuración
    ├─→ Administración (admin)
    └─→ Perfil
```

---

## Comunicación IPC

### Renderer → Main Process

**Servicios IPC (`src/services/`):**
```typescript
// Ejemplo de llamada IPC
const groups = await window.electronAPI.getGroups({ include_archived: true })
await window.electronAPI.createGroup(payload)
await window.electronAPI.updateGroup(id, payload)
```

### Handlers Principales (`electron/ipc-handlers.js`)

| Handler | Método | Descripción |
|---------|--------|-------------|
| `getGroups` | invoke | Obtener lista de grupos |
| `createGroup` | invoke | Crear nuevo grupo |
| `updateGroup` | invoke | Actualizar grupo |
| `deleteGroup` | invoke | Eliminar grupo |
| `getStudents` | invoke | Obtener alumnos de un grupo |
| `createStudent` | invoke | Crear nuevo alumno |
| `getGrades` | invoke | Obtener calificaciones |
| `saveGrades` | invoke | Guardar calificaciones |
| `exportDatabase` | invoke | Exportar base de datos |
| `syncDatabase` | invoke | Sincronizar con la nube |

---

## Estados Globales (Pinia)

### auth.ts
```typescript
{
  user: User | null,
  token: string | null,
  checked: boolean,
  isAuthenticated: boolean,
  isAdmin: boolean,
  checkSession: () => Promise<void>,
  login: (email, password) => Promise<void>,
  logout: () => Promise<void>
}
```

### toast.ts
```typescript
{
  toasts: Toast[],
  success: (message) => void,
  error: (message) => void,
  warning: (message) => void,
  info: (message) => void
}
```

### unsaved.ts
```typescript
{
  isDirty: boolean,
  save: () => Promise<void>,
  setDirty: (value: boolean) => void
}
```

---

## Seguridad

### Autenticación
- Hash de contraseñas con bcryptjs
- Sesión persistente en localStorage
- Guard de rutas protegidas

### Base de Datos
- Archivo local en `app.getPath('userData')`
- WAL mode para concurrencia
- Foreign keys habilitadas

### IPC
- Validación de datos en main process
- Sanitización de inputs
- Preload script como puente seguro

---

## Actualizaciones

### electron-updater
- Verificación automática al iniciar
- Descarga en segundo plano
- Instalación al reiniciar
- Servidor: `https://arkhegroup.com/updates/arkhe-aula/`

---

## Recursos Adicionales

### Documentación Relacionada
- [`basededatos.md`](./basededatos.md) - Estructura de la base de datos
- [`frontend.md`](./skills/frontend.md) - Convenciones del frontend
- [`compilador.md`](./skills/compilador.md) - Proceso de build

### Archivos de Configuración
- `package.json` - Dependencias y scripts
- `vite.config.ts` - Configuración de Vite
- `tsconfig.json` - Configuración de TypeScript
- `electron-builder` config en `package.json`
