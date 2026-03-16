# Sistema de Licencias y Suscripción - Freemium

## Modelo de Negocio

### Planes Disponibles

| Plan | Grupos | Alumnos | Características |
|------|--------|---------|----------------|
| **Free** | 3 | 40 | Asistencia, Evaluación básica, PDA, Equipos, Sin reportes, Sin sync, Sin soporte |
| **Básico** | 10 | 150 | Todo Free + Reportes básicos |
| **Premium** | Ilimitado | Ilimitado | Todo Básico + Sync en la nube + Soporte |
| **Enterprise** | Ilimitado | Ilimitado | Todo Premium + Soporte prioritario |

### Features por Plan

| Feature | Free | Basic | Premium | Enterprise |
|---------|------|-------|---------|------------|
| Grupos | 3 | 10 | ∞ | ∞ |
| Alumnos | 40 | 150 | ∞ | ∞ |
| Asistencia | ✅ | ✅ | ✅ | ✅ |
| Evaluación básica | ✅ | ✅ | ✅ | ✅ |
| PDA | ✅ | ✅ | ✅ | ✅ |
| Equipos | ✅ | ✅ | ✅ | ✅ |
| Reportes | ❌ | ✅ | ✅ | ✅ |
| Sync en la Nube | ❌ | ❌ | ✅ | ✅ |
| Soporte | ❌ | ❌ | ✅ | ✅ |

---

## Estructura Técnica

### Tabla de Base de Datos

**Ubicación:** `electron/database.js`

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

### Seed de Licencia Free

Por defecto se crea una licencia Free al inicializar la base de datos:

```javascript
db.prepare(`INSERT INTO licenses (school_id, plan_type, max_groups, max_students, has_reports, has_advanced_evaluation, has_cloud_sync, has_support) VALUES (1, 'free', 3, 40, 0, 0, 0, 0)`).run();
```

---

## API de Licencias

### IPC Handlers

| Handler | Descripción |
|---------|-------------|
| `license-get` | Obtener licencia actual de la escuela |
| `license-get-limits` | Obtener límites del plan actual |
| `license-check-limits` | Verificar si se puede agregar (grupos/alumnos) |
| `license-activate` | Activar licencia con clave y tipo de plan |

### Endpoints del Store

**Ubicación:** `src/stores/license.ts`

```typescript
// Estado
license: License | null
groupsCount: number
studentsCount: number

// Getters computados
isFree: boolean
isBasic: boolean
isPremium: boolean
canAddGroup: boolean
canAddStudent: boolean
groupsRemaining: number
studentsRemaining: number
hasReports: boolean
hasAdvancedEvaluation: boolean
hasCloudSync: boolean
hasSupport: boolean

// Métodos
loadLicense()
loadCounts()
checkLimit(type: 'groups' | 'students')
```

---

## Validación de Límites

### Grupos

**Handler:** `groups-create` en `electron/ipc-handlers.js`

```javascript
const license = db().prepare('SELECT max_groups FROM licenses WHERE school_id = 1 AND is_active = 1').get();
const currentGroups = db().prepare('SELECT COUNT(*) as cnt FROM groups WHERE archived_at IS NULL').get();

if (license && currentGroups.cnt >= license.max_groups) {
  return { success: false, message: `Límite alcanzado: Has llegado al máximo de ${license.max_groups} grupos permitidos en tu plan.`, limit: license.max_groups };
}
```

### Alumnos

**Handler:** `students-create` en `electron/ipc-handlers.js`

```javascript
const license = db().prepare('SELECT max_students FROM licenses WHERE school_id = 1 AND is_active = 1').get();
const currentStudents = db().prepare('SELECT COUNT(*) as cnt FROM students WHERE dropped_at IS NULL').get();

if (license && currentStudents.cnt >= license.max_students) {
  return { success: false, message: `Límite alcanzado: Has llegado al máximo de ${license.max_students} alumnos permitidos en tu plan.`, limit: license.max_students };
}
```

---

## Componente de Interfaz

### LicenseBanner

**Ubicación:** `src/components/LicenseBanner.vue`

Muestra un banner en la parte superior de la aplicación cuando el usuario tiene el plan Free:

- Badge "FREE" con color terciario
- Contador de grupos y alumnos restantes
- Botón "Actualizar a Premium" que dirige a https://arkhegroup.com/precios

**Integración:** Se importa en `src/layouts/AppLayout.vue`

---

## Activación de Licencias

### Planes Disponibles

```javascript
const plans = {
  basic: { max_groups: 10, max_students: 150, has_reports: 1, has_advanced_evaluation: 0, has_cloud_sync: 0, has_support: 0 },
  premium: { max_groups: 999999, max_students: 999999, has_reports: 1, has_advanced_evaluation: 1, has_cloud_sync: 1, has_support: 1 },
  enterprise: { max_groups: 999999, max_students: 999999, has_reports: 1, has_advanced_evaluation: 1, has_cloud_sync: 1, has_support: 1 }
};
```

### Uso del Handler

```javascript
await window.electronAPI.activateLicense('LICENSE_KEY', 'premium')
```

---

## Distribución de Versiones

### Estructura de Carpetas

```
Ejecutables/
├── v1.14.0/           # Versión actual completa
├── v1.13.0/           # Versiones anteriores
├── free/              # Versión gratuita (preparada)
└── latest.yml         # Manifest de actualización
```

### Versión Free

La versión gratuita se distribuirá desde:
- GitHub Releases (público)
- Página de descargas: https://arkhegroup.com/downloads/

---

## Notas para Desarrolladores

1. **Al crear un nuevo grupo/alumno**: Siempre verificar `license-check-limits` primero
2. **Para features condicionadas**: Usar `licenseStore.hasReports`, `hasAdvancedEvaluation`, etc.
3. **El banner**: Se muestra automáticamente si `licenseStore.isFree === true`
4. **La licencia**: Se crea automáticamente en el seed de la BD si no existe

---

*Documento creado: 16 de Marzo, 2026*
*Última actualización: 16 de Marzo, 2026*
