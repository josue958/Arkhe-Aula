# Histórico de Contexto - 2026-03-13 (Actualización)

## Fecha: 13 de Marzo, 2026

---

## Actualización: Estructura y Documentación del Sistema

### Descripción
Se actualizó y expandió la documentación del sistema Arkhe Aula con los siguientes cambios:

### 1. Archivos de Estructura Creados

#### `AgenteIA/estructura del sistema.md`
Documento completo que describe:
- **Arquitectura del sistema:** Diagrama Electron + Vue 3 + SQLite
- **Estructura de directorios:** Organización completa del proyecto
- **Módulos del sistema:** 14 módulos documentados con:
  - Propósito
  - Componentes
  - Funcionalidades
  - Rutas
- **Layout principal:** AppLayout.vue con sidebar y topbar
- **Flujo de navegación:** Mapa de rutas de la aplicación
- **Comunicación IPC:** Handlers principales
- **Estados globales (Pinia):** auth, toast, unsaved
- **Seguridad:** Autenticación, BD, IPC

**Módulos Documentados:**
1. Autenticación (`/auth`)
2. Grupos (`/groups`) - **Módulo de referencia para diseño**
3. Alumnos (`/students`)
4. Asistencia (`/attendance`)
5. Evaluación (`/evaluation`)
6. Conducta (`/behavior`)
7. Seguimiento PDA (`/planning`)
8. Equipos (`/teams`)
9. Incidentes (`/incidents`)
10. Reportes (`/reports`)
11. Configuración (`/settings`)
12. Administración (`/admin`)
13. Dashboard (`/`)
14. Perfil (`/profile`)

#### `AgenteIA/estructura de la basededatos.md`
Documento completo que describe:
- **Información general:** Motor, librería, ubicación
- **Datos de acceso:** Rutas por plataforma (Windows, macOS, Linux)
- **Ruta personalizada:** Cómo cambiar ubicación de la BD
- **Esquema completo:** 28 tablas documentadas con:
  - Propósito
  - Columnas detalladas (tipo, restricciones, descripción)
  - Índices
  - Relaciones (FK)
- **Diagrama Entidad-Relación:** Visualización completa de relaciones
- **Datos iniciales (seed):** Escuela, admin, estatus, indicadores
- **Migraciones:** Estructura y control
- **Funciones del sistema:** syncGrades, export, import, etc.
- **Buenas prácticas:** Performance, seguridad, mantenimiento

**Tablas Documentadas:**
- schools, users, active_session
- school_cycles, cycle_trimesters
- groups, group_periods
- student_statuses, students
- subject_templates, subjects
- evaluation_templates, activity_templates, activity_template_items
- evaluation_rubrics, activities
- performance_indicators
- grades, attendances, teams
- pdas, pda_groups, pda_sessions, pda_session_tracking
- behavior_records, incident_types, incidents
- grades_settings, cloud_sync_config

---

### 2. Actualización de Skills Existentes

#### `AgenteIA/skills/compilador.md`
**Agregado:** Sección completa de "Subida al Servidor de Actualizaciones"

**Contenido nuevo:**
- Configuración del servidor (URL, canal, método)
- Archivos a subir (latest.yml, ejecutables)
- Estructura del servidor de actualizaciones
- Script de subida automática (`scripts/upload-release.sh`)
- Comandos de subida
- Flujo completo de publicación
- Verificación de actualización
- Consideraciones importantes
- Solución de problemas

**Flujo de publicación:**
```bash
# 1. Actualizar versión
npm version patch    # o minor / major

# 2. Ejecutar build
npm run build:win    # o build:mac / build

# 3. Verificar archivos generados
ls -la Ejecutables/v*/

# 4. Subir al servidor
npm run upload-release

# 5. Verificar en el servidor
ssh arkhe_deploy@arkhegroup.com "ls -la /var/www/arkhegroup.com/updates/arkhe-aula/"

# 6. Crear tag en git
git push origin v$(node -p "require('./package.json').version")
```

#### `AgenteIA/skills/frontend.md`
**Agregado:** Sección "Diseño de Referencia: Módulo de Grupos"

**Contenido nuevo:**
- **IMPORTANTE:** El diseño de toda la aplicación debe seguir el patrón del módulo de grupos
- Características del diseño de GroupsPage.vue:
  - Page Header con título y acciones
  - Grid de cards (`.grid-3`, `.card`, `.card--glow`)
  - Badges para estados
  - Botones jerarquizados (primary, secondary, ghost, danger)
  - Modales con overlay
- Paleta de componentes con clases CSS específicas
- Ejemplos de código para cada componente

**Diseño de referencia:**
```vue
<!-- Page Header -->
<div class="page-header">
  <div>
    <h2>Grupos</h2>
    <p class="text-muted">Descripción o contador</p>
  </div>
  <div class="actions">
    <!-- Filtros, búsqueda, botones -->
  </div>
</div>

<!-- Grid de Cards -->
<div class="grid-3">
  <div class="card card--glow">
    <!-- Contenido -->
  </div>
</div>
```

---

### 3. Actualización del Documento Principal (`agente.md`)

**Agregado:** Referencia a los nuevos archivos de estructura en la "Nota de Lectura"

**Nota de Lectura actualizada:**
> Cuando se solicite leer este archivo, también debe considerarse el contenido completo de:
> - `AgenteIA/skills/` (todos los archivos .md)
> - `AgenteIA/contexto/` (todos los archivos .md del histórico)
> - `AgenteIA/estructura del sistema.md` (estructura completa del sistema)
> - `AgenteIA/estructura de la basededatos.md` (esquema detallado de la BD)

---

## Estructura Final de la Documentación

```
AgenteIA/
├── agente.md                          # Documento principal (respaldo)
├── estructura del sistema.md          # ⭐ NUEVO: Arquitectura y módulos
├── estructura de la basededatos.md    # ⭐ NUEVO: Esquema completo de BD
├── skills/
│   ├── compilador.md                  # Build y actualizaciones (actualizado)
│   ├── frontend.md                    # Convenciones (actualizado con diseño)
│   ├── basededatos.md                 # Referencia de BD
│   ├── instrucciones.md               # Instalación y desarrollo
│   └── pruebas.md                     # Testing
└── contexto/
    ├── 2026-03-13-creacion-agente.md  # Creación inicial
    └── 2026-03-13-actualizacion.md    # ⭐ ESTA ACTUALIZACIÓN
```

---

## Decisiones de Diseño Documentadas

### Módulo de Grupos como Referencia
El módulo de grupos (`src/pages/groups/GroupsPage.vue`) se establece como el **patrón de diseño oficial** para toda la aplicación porque:
- Implementa todos los componentes de UI estándar
- Sigue las mejores prácticas de Vue 3
- Tiene una estructura clara y mantenible
- Usa consistentemente la paleta de colores
- Implementa correctamente los estados de loading y vacío

### Base de Datos Normalizada
La base de datos sigue la **Tercera Forma Normal (3NF)** con:
- Tablas en plural y snake_case
- Foreign keys con CASCADE apropiado
- Índices en columnas de búsqueda frecuente
- Soft delete para auditoría
- WAL mode para concurrencia

---

## Comandos y Flujos Actualizados

### Build y Publicación
```bash
# Build completo
npm run build

# Build por plataforma
npm run build:win
npm run build:mac

# Subir al servidor (nuevo)
npm run upload-release
```

### Desarrollo
```bash
# Instalación
npm install

# Desarrollo (Vite + Electron)
npm run dev

# Solo frontend
npm run dev:vite
```

---

## Próximos Pasos Sugeridos

1. **Completar documentación de IPC:** Documentar todos los handlers de `ipc-handlers.js`
2. **Agregar diagramas:** Incluir diagramas UML de secuencia para flujos principales
3. **Documentar tests:** Una vez implementado el framework de testing
4. **Actualizar esquema:** Mantener actualizado `estructura de la basededatos.md` con cada migración
5. **Crear changelog:** Implementar `CHANGELOG.md` con los cambios de cada versión

---

## Notas Importantes

1. **Lectura obligatoria:** Los archivos `estructura del sistema.md` y `estructura de la basededatos.md` deben leerse cada vez que se trabaje en:
   - Nuevos módulos
   - Cambios en la base de datos
   - Refactorización de código
   - Onboarding de nuevos desarrolladores

2. **Diseño consistente:** Todos los nuevos módulos deben seguir el patrón de diseño del módulo de grupos

3. **Base de datos:** Cualquier cambio en el esquema debe:
   - Actualizar `estructura de la basededatos.md`
   - Crear archivo de migración
   - Actualizar `basededatos.md` skill

4. **Actualizaciones:** Seguir el flujo de publicación documentado en `compilador.md`

---

*Documento de contexto actualizado el 13 de Marzo, 2026 - Arkhe Systems*
