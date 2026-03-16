# Estructura de la Base de Datos - Arkhe Aula

## Información General

| Campo | Valor |
|-------|-------|
| **Motor** | SQLite 3 |
| **Librería** | better-sqlite3 ^8.2.0 |
| **Tipo** | Embebida (local-first) |
| **Archivo** | `arke_software.db` |
| **Ubicación** | `app.getPath('userData')` |
| **Configuración** | `electron/database.js` |

---

## Datos de Acceso

### Ruta de la Base de Datos

**Ruta por defecto:**
```javascript
// Windows
C:\Users\<usuario>\AppData\Roaming\arkhe-aula\arke_software.db

// macOS
/Users/<usuario>/Library/Application Support/arkhe-aula/arke_software.db

// Linux
/home/<usuario>/.config/arkhe-aula/arke_software.db
```

### Ruta Personalizada

El usuario puede cambiar la ubicación de la base de datos desde:
- **Configuración → Backup → Cambiar ubicación**
- Archivo de configuración: `custom_db_path.json` en `app.getPath('userData')`

### Conexión

```javascript
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('userData'), 'arke_software.db');
const db = new Database(dbPath);

// Configuración por defecto
db.pragma('journal_mode = WAL');  // Mejor concurrencia
db.pragma('foreign_keys = ON');    // Integridad referencial
db.pragma('synchronous = NORMAL'); // Balance rendimiento/seguridad
```

---

## Esquema de la Base de Datos

### Diagrama Entidad-Relación

```
┌─────────────────┐       ┌─────────────────┐
│    schools      │       │     users       │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ name            │       │ name            │
│ address         │       │ email           │
│ phone           │       │ password        │
│ email           │       │ role            │
│ principal_name  │       │ school_id ────┐ │
│ logo            │       │ is_active       │           │
│ setting_*       │       │ created_at      │           │
└────────┬────────┘       └─────────────────┘           │
         │                                              │
         │ ┌────────────────────────────────────────────┘
         │ │
         ▼ ▼
┌─────────────────────────────────────────────────────────┐
│                    school_cycles                         │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ school_id (FK) ────────────────────────────────────────┐
│ name                                                    │
│ start_date                                              │
│ end_date                                                │
│ is_active                                               │
└────────┬────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────┐
│                   cycle_trimesters                       │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ cycle_id (FK)                                            │
│ trimester_number                                        │
│ start_date                                              │
│ end_date                                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────────────────┐
│     groups      │       │      subject_templates      │
├─────────────────┤       ├─────────────────────────────┤
│ id              │       │ id                          │
│ user_id (FK) ───┼───┐   │ school_id (FK)              │
│ school_id (FK) ─┼─┐ │   │ name                        │
│ name            │ │ │   │ color                       │
│ grade           │ │ │   └──────────────┬──────────────┘
│ shift           │ │ │                  │
│ cycle           │ │ │                  │ 1:N
│ current_period  │ │ │                  ▼
│ archived_at     │ │ │   ┌─────────────────────────────┐
└────────┬────────┘ │ │   │        subjects             │
         │          │ │   ├─────────────────────────────┤
         │ 1:N      │ │   │ id (PK)                     │
         │          │ │   │ group_id (FK)               │
         ▼          │ │   │ subject_template_id (FK)    │
┌─────────────────┐ │ │   │ name                        │
│ group_periods   │ │ │   │ color                       │
├─────────────────┤ │ │   └─────────────────────────────┘
│ id              │ │ │
│ group_id (FK)   │─┘ │
│ period          │   │
│ start_date      │   │
│ end_date        │   │
└─────────────────┘   │
                      │
┌─────────────────┐   │
│ student_statuses│   │
├─────────────────┤   │
│ id              │   │
│ school_id (FK) ─┼───┘
│ name            │
│ color           │
│ is_default      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────┐
│                      students                            │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ group_id (FK) ────────────────────────────────────────┐
│ student_status_id (FK)                                 │
│ first_name                                             │
│ paternal_surname                                       │
│ maternal_surname                                       │
│ curp                                                   │
│ email                                                  │
│ phone                                                  │
│ birth_date                                             │
│ gender                                                 │
│ address                                                │
│ enrolled_at                                            │
│ dropped_at                                             │
│ sort_order                                             │
└────────┬───────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────┐
│                      grades                              │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ student_id (FK)                                          │
│ activity_id (FK)                                         │
│ score                                                    │
│ created_at                                               │
│ updated_at                                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────┐
│    evaluation_templates     │
├─────────────────────────────┤
│ id (PK)                     │
│ school_id (FK)              │
│ name                        │
└────────┬────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────┐
│    activity_templates       │
├─────────────────────────────┤
│ id (PK)                     │
│ evaluation_template_id (FK) │
│ name                        │
│ percentage                  │
│ sort_order                  │
│ is_extra                    │
└────────┬────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────┐
│  activity_template_items    │
├─────────────────────────────┤
│ id (PK)                     │
│ activity_template_id (FK)   │
│ name                        │
│ sort_order                  │
└─────────────────────────────┘

┌─────────────────────────────┐
│    evaluation_rubrics       │
├─────────────────────────────┤
│ id (PK)                     │
│ subject_id (FK)             │
│ evaluation_template_id (FK) │
│ name                        │
│ percentage                  │
│ period_id                   │
│ sort_order                  │
│ is_extra                    │
└────────┬────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────┐
│       activities            │
├─────────────────────────────┤
│ id (PK)                     │
│ rubric_id (FK)              │
│ activity_template_id (FK)   │
│ name                        │
│ period_id                   │
│ sort_order                  │
└─────────────────────────────┘

┌─────────────────────────────┐
│   performance_indicators    │
├─────────────────────────────┤
│ id (PK)                     │
│ school_id (FK)              │
│ label                       │
│ min_value                   │
│ max_value                   │
│ color                       │
│ sort_order                  │
└─────────────────────────────┘

┌─────────────────┐       ┌─────────────────────────────┐
│   attendances   │       │         teams               │
├─────────────────┤       ├─────────────────────────────┤
│ id              │       │ id (PK)                     │
│ student_id (FK) │       │ activity_id (FK)            │
│ group_id (FK)   │       │ student_id (FK)             │
│ date            │       │ team_number                 │
│ status          │       │ comments                    │
│ notes           │       │ topic                       │
└─────────────────┘       └─────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                       pdas                               │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ user_id (FK)                                             │
│ topic                                                    │
│ subject_name                                             │
│ num_sessions                                             │
└────────┬─────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────┐
│                   pda_sessions                           │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ pda_id (FK)                                              │
│ session_number                                           │
│ activity                                                 │
│ observations                                             │
└────────┬─────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────┐
│              pda_session_tracking                        │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ pda_session_id (FK)                                      │
│ group_id (FK)                                            │
│ start_date                                               │
│ end_date                                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────┐
│    behavior_records         │
├─────────────────────────────┤
│ id (PK)                     │
│ student_id (FK)             │
│ group_id (FK)               │
│ date                        │
│ behavior_type               │
│ observations                │
└─────────────────────────────┘

┌─────────────────────────────┐
│     incident_types          │
├─────────────────────────────┤
│ id (PK)                     │
│ name                        │
└────────┬────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────┐
│       incidents             │
├─────────────────────────────┤
│ id (PK)                     │
│ student_id (FK)             │
│ group_id (FK)               │
│ incident_date               │
│ incident_type_id (FK)       │
│ description                 │
│ notified_authorities        │
│ tutor_contacted             │
│ contact_method              │
│ contact_datetime            │
│ school_name                 │
│ teacher_name                │
└─────────────────────────────┘

┌─────────────────────────────┐
│    grades_settings          │
├─────────────────────────────┤
│ id (PK)                     │
│ subject_id (FK)             │
│ period_id                   │
│ column_layout               │
│ zoom_level                  │
└─────────────────────────────┘

┌─────────────────────────────┐
│    cloud_sync_config        │
├─────────────────────────────┤
│ id (PK)                     │
│ enabled                     │
│ auto_sync                   │
│ service                     │
│ last_sync                   │
│ config_json                 │
└─────────────────────────────┘
```

---

## Tablas Detalladas

### schools
**Propósito:** Configuración general de la escuela

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| name | TEXT | NOT NULL DEFAULT 'Mi Escuela' | Nombre de la escuela |
| address | TEXT | | Dirección |
| phone | TEXT | | Teléfono |
| email | TEXT | | Email |
| principal_name | TEXT | | Nombre del director |
| logo | BLOB | | Logo de la escuela |
| logo_mime | TEXT | | MIME type del logo |
| state_logo | BLOB | | Logo del estado |
| state_logo_mime | TEXT | | MIME type del logo estatal |
| setting_max_score | REAL | DEFAULT 10 | Calificación máxima |
| setting_min_pass | REAL | DEFAULT 6 | Calificación mínima aprobatoria |
| setting_periods | INTEGER | DEFAULT 3 | Número de periodos (trimestres) |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### users
**Propósito:** Usuarios del sistema (multi-usuario local)

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| name | TEXT | NOT NULL | Nombre completo |
| email | TEXT | UNIQUE NOT NULL | Email (usado para login) |
| password | TEXT | NOT NULL | Hash de contraseña (bcrypt) |
| role | TEXT | DEFAULT 'teacher' CHECK IN ('admin', 'teacher') | Rol del usuario |
| school_id | INTEGER | FK → schools(id) | Escuela asignada |
| is_active | INTEGER | DEFAULT 1 | Usuario activo (1) o inactivo (0) |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

**Índices:**
- `email` (UNIQUE)

---

### active_session
**Propósito:** Sesión activa (solo 1 usuario a la vez en desktop)

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY DEFAULT 1 | ID fijo (siempre 1) |
| user_id | INTEGER | FK → users(id) | Usuario en sesión |
| logged_in_at | TEXT | DEFAULT datetime('now') | Fecha de login |

---

### school_cycles
**Propósito:** Ciclos escolares

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| school_id | INTEGER | FK → schools(id) | Escuela |
| name | TEXT | NOT NULL | Nombre del ciclo (ej: "2024-2025") |
| start_date | TEXT | | Fecha de inicio |
| end_date | TEXT | | Fecha de fin |
| is_active | INTEGER | DEFAULT 0 | Ciclo activo |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### cycle_trimesters
**Propósito:** Trimestres por ciclo escolar

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| cycle_id | INTEGER | FK → school_cycles(id) ON DELETE CASCADE | Ciclo |
| trimester_number | INTEGER | NOT NULL | Número de trimestre (1, 2, 3) |
| start_date | TEXT | | Fecha de inicio |
| end_date | TEXT | | Fecha de fin |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

**Índices:**
- UNIQUE(cycle_id, trimester_number)

---

### groups
**Propósito:** Grupos escolares

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| user_id | INTEGER | FK → users(id) | Docente asignado |
| school_id | INTEGER | FK → schools(id) | Escuela |
| name | TEXT | NOT NULL | Nombre/letra del grupo |
| grade | TEXT | NOT NULL DEFAULT '1' | Grado (1-6) |
| cycle | TEXT | NOT NULL DEFAULT '' | Ciclo escolar |
| shift | TEXT | DEFAULT 'matutino' | Turno (matutino/vespertino) |
| current_period | INTEGER | DEFAULT 1 | Trimestre actual |
| archived_at | TEXT | | Fecha de archivado (NULL = activo) |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

**Índices:**
- `user_id`
- `school_id`
- `archived_at`

---

### group_periods
**Propósito:** Períodos (trimestres) por grupo

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| group_id | INTEGER | FK → groups(id) ON DELETE CASCADE | Grupo |
| period | INTEGER | NOT NULL | Número de periodo |
| start_date | TEXT | | Fecha de inicio |
| end_date | TEXT | | Fecha de fin |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

**Índices:**
- UNIQUE(group_id, period)

---

### student_statuses
**Propósito:** Estatus de alumnos (activo, baja, traslado, etc.)

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| school_id | INTEGER | FK → schools(id) | Escuela |
| name | TEXT | NOT NULL | Nombre del estatus |
| color | TEXT | DEFAULT '#6b7280' | Color para UI |
| is_default | INTEGER | DEFAULT 0 | Estatus por defecto |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### students
**Propósito:** Alumnos

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| group_id | INTEGER | FK → groups(id) ON DELETE CASCADE | Grupo asignado |
| student_status_id | INTEGER | FK → student_statuses(id) | Estatus actual |
| first_name | TEXT | NOT NULL | Nombre(s) |
| paternal_surname | TEXT | NOT NULL DEFAULT '' | Apellido paterno |
| maternal_surname | TEXT | DEFAULT '' | Apellido materno |
| curp | TEXT | | CURP |
| email | TEXT | | Email |
| phone | TEXT | | Teléfono |
| birth_date | TEXT | | Fecha de nacimiento |
| gender | TEXT | | Género |
| address | TEXT | | Dirección |
| enrolled_at | TEXT | | Fecha de inscripción |
| dropped_at | TEXT | | Fecha de baja |
| sort_order | INTEGER | DEFAULT 0 | Orden en la lista |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

**Índices:**
- `group_id`
- `student_status_id`

---

### subject_templates
**Propósito:** Plantillas de materias (reutilizables por escuela)

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| school_id | INTEGER | FK → schools(id) | Escuela |
| name | TEXT | NOT NULL | Nombre de la materia |
| color | TEXT | DEFAULT '#6366f1' | Color para UI |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### subjects
**Propósito:** Materias asignadas a grupos

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| group_id | INTEGER | FK → groups(id) ON DELETE CASCADE | Grupo |
| subject_template_id | INTEGER | FK → subject_templates(id) | Plantilla original |
| name | TEXT | NOT NULL | Nombre de la materia |
| color | TEXT | DEFAULT '#6366f1' | Color para UI |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### evaluation_templates
**Propósito:** Plantillas de evaluación

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| school_id | INTEGER | FK → schools(id) | Escuela |
| name | TEXT | NOT NULL | Nombre de la plantilla |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### activity_templates
**Propósito:** Plantillas de actividades

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| evaluation_template_id | INTEGER | FK → evaluation_templates(id) ON DELETE CASCADE | Plantilla de evaluación |
| name | TEXT | NOT NULL | Nombre de la actividad |
| percentage | REAL | DEFAULT 0 | Porcentaje de la calificación |
| sort_order | INTEGER | DEFAULT 0 | Orden |
| is_extra | INTEGER | DEFAULT 0 | Es actividad extra |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### activity_template_items
**Propósito:** Ítems dentro de plantillas de actividad

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| activity_template_id | INTEGER | FK → activity_templates(id) ON DELETE CASCADE | Actividad plantilla |
| name | TEXT | NOT NULL | Nombre del ítem |
| sort_order | INTEGER | DEFAULT 0 | Orden |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |

---

### evaluation_rubrics
**Propósito:** Rúbricas de evaluación por materia

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| subject_id | INTEGER | FK → subjects(id) ON DELETE CASCADE | Materia |
| evaluation_template_id | INTEGER | FK → evaluation_templates(id) | Plantilla |
| name | TEXT | NOT NULL | Nombre de la rúbrica |
| percentage | REAL | DEFAULT 0 | Porcentaje |
| period_id | INTEGER | DEFAULT 1 | Trimestre |
| sort_order | INTEGER | DEFAULT 0 | Orden |
| is_extra | INTEGER | DEFAULT 0 | Es extra |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### activities
**Propósito:** Actividades de evaluación

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| rubric_id | INTEGER | FK → evaluation_rubrics(id) ON DELETE CASCADE | Rúbrica |
| activity_template_id | INTEGER | FK → activity_templates(id) | Plantilla |
| name | TEXT | NOT NULL | Nombre de la actividad |
| period_id | INTEGER | DEFAULT 1 | Trimestre |
| sort_order | INTEGER | DEFAULT 0 | Orden |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### performance_indicators
**Propósito:** Indicadores de desempeño (semáforo)

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| school_id | INTEGER | FK → schools(id) | Escuela |
| label | TEXT | NOT NULL | Etiqueta (ej: "Bien") |
| min_value | REAL | NOT NULL | Valor mínimo |
| max_value | REAL | NOT NULL | Valor máximo |
| color | TEXT | DEFAULT '#22c55e' | Color |
| sort_order | INTEGER | DEFAULT 0 | Orden |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |

**Datos por defecto:**
| label | min_value | max_value | color |
|-------|-----------|-----------|-------|
| Insuficiente | 0 | 5.9 | #ef4444 |
| Suficiente | 6 | 6.9 | #f59e0b |
| Bien | 7 | 7.9 | #3b82f6 |
| Muy Bien | 8 | 8.9 | #22c55e |
| Excelente | 9 | 10 | #8b5cf6 |

---

### grades
**Propósito:** Calificaciones

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| student_id | INTEGER | FK → students(id) ON DELETE CASCADE | Alumno |
| activity_id | INTEGER | FK → activities(id) ON DELETE CASCADE | Actividad |
| score | REAL | DEFAULT 0 | Calificación |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

**Índices:**
- UNIQUE(student_id, activity_id)

---

### attendances
**Propósito:** Registro de asistencias

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| student_id | INTEGER | FK → students(id) ON DELETE CASCADE | Alumno |
| group_id | INTEGER | FK → groups(id) ON DELETE CASCADE | Grupo |
| date | TEXT | NOT NULL | Fecha |
| status | TEXT | NOT NULL DEFAULT 'present' CHECK IN ('present', 'absent', 'late') | Estatus |
| notes | TEXT | | Notas |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

**Índices:**
- UNIQUE(student_id, group_id, date)

---

### teams
**Propósito:** Equipos de trabajo por actividad

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| activity_id | INTEGER | FK → activities(id) ON DELETE CASCADE | Actividad |
| student_id | INTEGER | FK → students(id) ON DELETE CASCADE | Alumno |
| team_number | INTEGER | DEFAULT 0 | Número de equipo (0 = sin equipo) |
| comments | TEXT | | Comentarios |
| topic | TEXT | DEFAULT '' | Tema del equipo |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

**Índices:**
- UNIQUE(activity_id, student_id)

---

### pdas
**Propósito:** Seguimiento de PDA (Planeación Didáctica)

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| user_id | INTEGER | FK → users(id) | Docente |
| topic | TEXT | NOT NULL | Tema |
| subject_name | TEXT | NOT NULL | Materia |
| num_sessions | INTEGER | DEFAULT 1 | Número de sesiones |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### pda_groups
**Propósito:** Grupos asignados a un PDA

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| pda_id | INTEGER | FK → pdas(id) ON DELETE CASCADE | PDA |
| group_id | INTEGER | FK → groups(id) ON DELETE CASCADE | Grupo |

**Índices:**
- UNIQUE(pda_id, group_id)

---

### pda_sessions
**Propósito:** Sesiones de un PDA

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| pda_id | INTEGER | FK → pdas(id) ON DELETE CASCADE | PDA |
| session_number | INTEGER | NOT NULL | Número de sesión |
| activity | TEXT | | Actividad |
| observations | TEXT | | Observaciones |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### pda_session_tracking
**Propósito:** Seguimiento de sesiones por grupo

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| pda_session_id | INTEGER | FK → pda_sessions(id) ON DELETE CASCADE | Sesión |
| group_id | INTEGER | FK → groups(id) ON DELETE CASCADE | Grupo |
| start_date | TEXT | | Fecha de inicio |
| end_date | TEXT | | Fecha de fin |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

**Índices:**
- UNIQUE(pda_session_id, group_id)

---

### behavior_records
**Propósito:** Registro de comportamiento

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| student_id | INTEGER | FK → students(id) ON DELETE CASCADE | Alumno |
| group_id | INTEGER | FK → groups(id) ON DELETE CASCADE | Grupo |
| date | TEXT | NOT NULL | Fecha |
| behavior_type | TEXT | NOT NULL DEFAULT 'neutral' CHECK IN ('good', 'neutral', 'bad') | Tipo |
| observations | TEXT | | Observaciones |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### incident_types
**Propósito:** Tipos de incidente

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| name | TEXT | NOT NULL UNIQUE | Nombre del tipo |

---

### incidents
**Propósito:** Registro de incidentes

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| student_id | INTEGER | FK → students(id) ON DELETE CASCADE | Alumno |
| group_id | INTEGER | FK → groups(id) ON DELETE CASCADE | Grupo |
| incident_date | TEXT | NOT NULL | Fecha del incidente |
| incident_type_id | INTEGER | FK → incident_types(id) | Tipo |
| description | TEXT | | Descripción |
| notified_authorities | TEXT | | Autoridades notificadas |
| tutor_contacted | INTEGER | DEFAULT 0 | Tutor contactado (1/0) |
| contact_method | TEXT | | Método de contacto |
| contact_datetime | TEXT | | Fecha de contacto |
| school_name | TEXT | | Nombre de la escuela |
| teacher_name | TEXT | | Nombre del docente |
| created_at | TEXT | DEFAULT datetime('now') | Fecha de creación |
| updated_at | TEXT | DEFAULT datetime('now') | Fecha de actualización |

---

### grades_settings
**Propósito:** Configuración de la tabla de calificaciones

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| subject_id | INTEGER | FK → subjects(id) ON DELETE CASCADE | Materia |
| period_id | INTEGER | NOT NULL | Trimestre |
| column_layout | TEXT | | Layout de columnas (JSON) |
| zoom_level | REAL | DEFAULT 1 | Nivel de zoom |

**Índices:**
- UNIQUE(subject_id, period_id)

---

### cloud_sync_config
**Propósito:** Configuración de sincronización en la nube

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | INTEGER | PRIMARY KEY DEFAULT 1 | ID fijo |
| enabled | INTEGER | DEFAULT 0 | Sincronización habilitada |
| auto_sync | INTEGER | DEFAULT 0 | Auto-sincronización |
| service | TEXT | DEFAULT 'none' | Servicio (none, drive, dropbox) |
| last_sync | TEXT | | Última sincronización |
| config_json | TEXT | | Configuración adicional (JSON) |

---

## Datos Iniciales (Seed)

### Escuela por defecto
```sql
INSERT INTO schools (name, setting_max_score, setting_min_pass, setting_periods)
VALUES ('Mi Escuela', 10, 6, 3);
```

### Usuario admin por defecto
```sql
-- Password: admin123 (hash bcrypt)
INSERT INTO users (name, email, password, role, school_id)
VALUES ('Administrador', 'admin@arkhe.local', '$2a$10$...', 'admin', 1);
```

### Estatus de alumnos por defecto
```sql
INSERT INTO student_statuses (school_id, name, color, is_default) VALUES
(1, 'Activo', '#22c55e', 1),
(1, 'Baja', '#ef4444', 0),
(1, 'Traslado', '#f59e0b', 0),
(1, 'Irregular', '#8b5cf6', 0);
```

### Indicadores de desempeño por defecto
```sql
INSERT INTO performance_indicators (school_id, label, min_value, max_value, color, sort_order) VALUES
(1, 'Insuficiente', 0, 5.9, '#ef4444', 1),
(1, 'Suficiente', 6, 6.9, '#f59e0b', 2),
(1, 'Bien', 7, 7.9, '#3b82f6', 3),
(1, 'Muy Bien', 8, 8.9, '#22c55e', 4),
(1, 'Excelente', 9, 10, '#8b5cf6', 5);
```

---

## Migraciones

### Estructura de Archivos
```
electron/
└── migrations/
    ├── 001_create_schema.sql
    ├── 002_add_teams_topic.sql
    ├── 003_add_students_enrolled_at.sql
    └── ...
```

### Tabla de Control
```sql
CREATE TABLE migraciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL,
    fecha_ejecucion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Funciones del Sistema

### syncGrades()
Sincroniza calificaciones al iniciar la app. Crea registros faltantes en `grades`.

### syncGradesForStudent(studentId)
Sincroniza calificaciones para un alumno nuevo.

### syncGradesForActivity(activityId)
Sincroniza calificaciones para una actividad nueva.

### exportDatabase(destPath)
Exporta la base de datos a otra ubicación (backup).

### importDatabase(srcPath)
Importa una base de datos desde otra ubicación.

### changeDatabase(newPath)
Cambia la ruta de la base de datos.

---

## Buenas Prácticas

### Performance
- Usar índices en columnas de búsqueda frecuente
- Habilitar WAL mode para concurrencia
- Usar transacciones para operaciones múltiples
- Prepared statements para consultas repetidas

### Seguridad
- Parámetros vinculados para prevenir SQL injection
- Hash de contraseñas con bcrypt
- Validar datos antes de insertar/actualizar
- Soft delete para auditoría

### Mantenimiento
- Ejecutar VACUUM periódicamente
- Backups automáticos cada 10 minutos
- Monitorear tamaño de la BD
- Limpiar datos antiguos

---

## Referencias

### Archivos Relacionados
- [`electron/database.js`](../electron/database.js) - Configuración de la BD
- [`electron/ipc-handlers.js`](../electron/ipc-handlers.js) - Handlers IPC
- [`basededatos.md`](./skills/basededatos.md) - Skill de base de datos

### Documentación Externa
- [better-sqlite3 Documentation](https://github.com/JoshuaWise/better-sqlite3)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
