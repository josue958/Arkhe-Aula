# Arke_Software — Plan del Proyecto de Escritorio

## Análisis de la Aplicación Web Existente

### Stack Actual (Web)
- **Backend**: Laravel 11 + Inertia.js + SQLite
- **Frontend**: Vue 3 + TypeScript + TailwindCSS
- **Electron**: Ya existe un intento en `arkhe-aula-desktop/` pero sin base de datos integrada
- **Móvil**: Capacitor + sql.js para iOS/Android

### Módulos Identificados
1. **Autenticación** — Login/Registro de usuarios
2. **Dashboard** — Resumen general de grupos y estadísticas
3. **Grupos** — CRUD de grupos por ciclo escolar, turno, grado
4. **Alumnos** — CRUD de estudiantes, importación masiva, cambio de estatus, bajas
5. **Asistencia** — Toma de asistencia diaria, reportes con filtros por trimestre
6. **Evaluación** — Calificaciones por rubrica/actividad/período, exportación Excel
7. **Reportes** — Estadísticas de evaluación, asistencia, reportes trimestrales
8. **Configuración** — Escuela, logos, ciclos escolares, materias, semáforo de calificaciones, estatus de alumnos, actividades sumativas, trimestres/períodos
9. **Admin** — Gestión de usuarios del sistema

### Modelos de Base de Datos
- users, schools, school_cycles, groups, group_periods
- students, student_statuses
- subjects, subject_templates
- evaluation_rubrics, activities, performance_indicators, evaluation_templates, activity_templates
- grades, attendances

---

## Arquitectura del Proyecto Desktop (`Arke_Software`)

```
Arke_Software/
├── electron/              # Proceso principal de Electron
│   ├── main.js            # Entry point principal
│   ├── preload.js         # Bridge seguro renderer↔main
│   ├── database.js        # Gestión de SQLite con better-sqlite3
│   └── ipc-handlers.js    # Todos los handlers IPC
├── src/                   # Frontend Vue 3
│   ├── main.ts            # Entry point Vue
│   ├── App.vue            # Componente raíz
│   ├── router/            # Vue Router
│   ├── store/             # Pinia state management
│   ├── components/        # Componentes reutilizables
│   ├── pages/             # Páginas de la aplicación
│   │   ├── auth/          # Login
│   │   ├── Dashboard.vue
│   │   ├── groups/        # Grupos
│   │   ├── students/      # Alumnos
│   │   ├── attendance/    # Asistencia
│   │   ├── evaluation/    # Evaluación
│   │   ├── reports/       # Reportes
│   │   └── settings/      # Configuración
│   ├── services/          # Servicios IPC
│   └── assets/            # Estilos e imágenes
├── build/                 # Íconos y recursos del instalador
├── package.json           # Configuración del proyecto
└── vite.config.ts         # Configuración Vite
```

## Decisiones Técnicas

### Base de Datos — `better-sqlite3` (NO sql.js)
- `better-sqlite3` es **síncrono** y nativo — MUCHO más rápido y confiable
- En Electron main process, no hay restricción de WASM
- El archivo `.db` vive en `app.getPath('userData')` — persistente entre sesiones
- Compatible: Windows 7+ (con Node.js 14), macOS Sierra 10.12+

### IPC Pattern (Renderer → Main → DB)
- El renderer NO accede a SQLite directamente
- Todo pasa por `contextBridge` en `preload.js` → handlers IPC en `electron/`
- Patrón: `window.electronAPI.invoke('nombre-accion', data)`

### Compatibilidad Windows 7
- Electron 22.x es la última versión compatible con Windows 7
- Target: `electron@22.3.27`
- Windows 7 requiere Visual C++ 2015 Redistributable

### Compatibilidad macOS Sierra 10.12
- Electron 22.x también soporta macOS 10.13+ (High Sierra mínimo)
- Para Sierra 10.12 usamos Electron 18.x  
- Target: `electron@22` con `minimumSystemVersion: "10.12.0"`

### Empaquetamiento
- `electron-builder@24.x` para generar instaladores
- Windows: NSIS (.exe instalador) + Portable
- macOS: DMG + APP
- Íconos en `build/icon.icns` (Mac) y `build/icon.ico` (Win)

---

## Checklist de Desarrollo

- [ ] Inicializar proyecto con Vite + Vue 3 + TypeScript
- [ ] Configurar Electron 22 con IPC seguro
- [ ] Implementar base de datos SQLite con better-sqlite3
- [ ] Crear esquema SQL completo (basado en migrations de Laravel)
- [ ] Módulo de Autenticación (login local, hash de contraseña)
- [ ] Dashboard
- [ ] Módulo de Grupos
- [ ] Módulo de Alumnos (con importación XLSX)
- [ ] Módulo de Asistencia
- [ ] Módulo de Evaluación (rúbricas, actividades, calificaciones)
- [ ] Módulo de Reportes (Excel export con xlsx)
- [ ] Módulo de Configuración
- [ ] Configurar electron-builder para Win + Mac
- [ ] Generar íconos (icns + ico)
- [ ] Build de prueba
