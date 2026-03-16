# Skill: Base de Datos

## Propósito
Este skill define la estructura, normalización y buenas prácticas para la base de datos SQLite de Arkhe Aula.

## Configuración Técnica

### Motor de Base de Datos
| Propiedad | Valor |
|-----------|-------|
| **Motor** | SQLite 3 |
| **Librería** | better-sqlite3 ^8.2.0 |
| **Tipo** | Embebida (local-first) |
| **Ubicación** | Configurada en `electron/database.js` |

## Principios de Diseño

### Normalización
La base de datos debe cumplir al menos la **Tercera Forma Normal (3NF)**:

1. **1NF:** Cada columna contiene valores atómicos
2. **2NF:** Cumple 1NF y no hay dependencias parciales
3. **3NF:** Cumple 2NF y no hay dependencias transitivas

### Reglas de Integridad
- **Integridad de Entidad:** Primary Key única y no nula
- **Integridad Referencial:** Foreign Keys con CASCADE apropiado
- **Integridad de Dominio:** CHECK constraints para validación de datos

## Convenciones de Nomenclatura

### Tablas
- Nombres en **plural** y **snake_case**
- Ejemplos: `usuarios`, `evaluaciones_docentes`, `grupos_estudiantes`

### Columnas
- Nombres en **snake_case**
- Primary Key siempre llamada `id`
- Foreign Keys: `nombre_tabla_singular_id` (ej: `usuario_id`)
- Fechas: `created_at`, `updated_at`, `deleted_at` (soft delete)

### Índices
- Patrón: `idx_nombre_tabla_columna`
- Ejemplo: `idx_usuarios_email`

## Esquema de Base de Datos

### Tablas Principales

#### usuarios
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

#### evaluaciones
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

#### grupos
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

#### grupos_estudiantes (Tabla intermedia)
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

#### criterios_evaluacion
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

#### respuestas_evaluacion
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

## Operaciones CRUD

### Configuración de better-sqlite3
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

### Ejemplos de Consultas

#### Insertar con transacción
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

#### Consultar con JOIN
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

#### Actualizar
```javascript
const actualizarUsuario = db.prepare(`
  UPDATE usuarios 
  SET nombre = ?, email = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

actualizarUsuario('Nuevo Nombre', 'nuevo@email.com', 1);
```

#### Eliminar (Soft Delete)
```javascript
const eliminarUsuario = db.prepare(`
  UPDATE usuarios 
  SET activo = 0, deleted_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

eliminarUsuario(1);
```

## Migraciones

### Estructura de Archivos de Migración
```
electron/
└── migrations/
    ├── 001_create_usuarios.sql
    ├── 002_create_evaluaciones.sql
    ├── 003_create_grupos.sql
    └── ...
```

### Tabla de Control de Migraciones
```sql
CREATE TABLE migraciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL,
    fecha_ejecucion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Script de Migración
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

## Buenas Prácticas

### Performance
- Usar **índices** en columnas de búsqueda frecuente
- Usar **transacciones** para operaciones múltiples
- Habilitar **WAL mode** para concurrencia
- Usar **prepared statements** para consultas repetidas

### Seguridad
- Usar **parámetros vinculados** para prevenir SQL injection
- Hashear contraseñas con **bcrypt** antes de almacenar
- Validar datos antes de insertar/actualizar
- Implementar **soft delete** para auditoría

### Mantenimiento
- Ejecutar **VACUUM** periódicamente
- Monitorear tamaño de la base de datos
- Hacer **backups** automáticos
- Limpiar datos antiguos/archivados

### Backup
```javascript
function crearBackup(db, rutaBackup) {
  const backup = db.prepare('VACUUM INTO ?').run(rutaBackup);
  console.log(`Backup creado: ${rutaBackup}`);
}
```

## Referencias de Documentación

### Cuando Crear/Modificar Componentes
Cada vez que se cree o modifique:
1. **Tablas:** Actualizar este archivo con el esquema
2. **Migraciones:** Crear archivo SQL en `migrations/`
3. **IPC Handlers:** Actualizar `electron/ipc-handlers.js`
4. **Servicios Frontend:** Actualizar `src/services/`

- Cardinalidad de relaciones

## Persistencia de Ajustes Locales (LocalStorage)

Para configuraciones técnicas y preferencias de sesión que no requieren almacenamiento en BD persistente de servidor:

| Clave | Descripción | Valores |
| :--- | :--- | :--- |
| `arkhe-ai-model` | Modelo de IA seleccionado | `gemini-3-flash`, `qwen-2.5-72b`, etc. |
| `arkhe-qwen-key` | Token de API para Qwen | String (encriptado en BD local si es sensible) |
| `arkhe-sync-config` | Estado de sincronización | JSON stringified |

> **Nota:** Estas claves se gestionan principalmente desde `SettingsPage.vue`.

## Tabla de Licencias (Freemium)

### licenses
```sql
CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER REFERENCES schools(id),
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK(plan_type IN ('free', 'basic', 'premium', 'enterprise')),
  license_key TEXT,
  max_groups INTEGER DEFAULT 3,
  max_students INTEGER DEFAULT 40,
  has_reports INTEGER DEFAULT 0,
  has_advanced_evaluation INTEGER DEFAULT 0,
  has_cloud_sync INTEGER DEFAULT 0,
  has_support INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  activated_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_licenses_school ON licenses(school_id);
```

### Planes
| Plan | max_groups | max_students | has_reports | has_advanced_evaluation | has_cloud_sync | has_support |
|------|------------|--------------|-------------|------------------------|----------------|--------------|
| free | 3 | 40 | 0 | 0 | 0 | 0 |
| basic | 10 | 150 | 1 | 0 | 0 | 0 |
| premium | 999999 | 999999 | 1 | 1 | 1 | 1 |
| enterprise | 999999 | 999999 | 1 | 1 | 1 | 1 |

### IPC Handlers Relacionados
- `license-get` - Obtener licencia actual
- `license-get-limits` - Obtener límites del plan
- `license-check-limits` - Verificar límites antes de crear
- `license-activate` - Activar licencia con clave

### Validación de Límites
En `groups-create` y `students-create` se verifica el límite antes de crear:
```javascript
const license = db().prepare('SELECT max_groups FROM licenses WHERE school_id = 1 AND is_active = 1').get();
const currentGroups = db().prepare('SELECT COUNT(*) as cnt FROM groups WHERE archived_at IS NULL').get();
if (license && currentGroups.cnt >= license.max_groups) {
  return { success: false, message: `Límite alcanzado: Has llegado al máximo de ${license.max_groups} grupos...` };
}
```

### StoreFrontend
- **Ubicación:** `src/stores/license.ts`
- **Funciones:** `loadLicense()`, `loadCounts()`, `checkLimit()`
- **Getters:** `canAddGroup`, `canAddStudent`, `groupsRemaining`, `studentsRemaining`, `hasReports`, `hasAdvancedEvaluation`

## Recursos Adicionales

### Documentación Oficial
- [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

### Herramientas
- **DB Browser for SQLite** - Visor y editor gráfico
- **SQLite Studio** - Administración de bases de datos
