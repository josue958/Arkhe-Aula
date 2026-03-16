# Arkhe Aula — Descripción del Software

## 1. Nombre del Software

**Arkhe Aula**  
*Sistema de Evaluación Docente para Escritorio*

**Eslogan:** "Control total de tu práctica docente en un solo lugar"

---

## 2. Problema que Resuelve

Arkhe Aula resuelve los principales desafíos administrativos y pedagógicos que enfrentan los docentes en su práctica diaria:

### Problemas Principales

| Problema | Impacto en el Docente |
|----------|----------------------|
| **Control de asistencia manual** | Pérdida de 10-15 minutos por clase en pasar lista |
| **Cálculo manual de calificaciones** | Errores de cálculo, tiempo excesivo en promedios |
| **Registro disperso de incidentes** | Dificultad para dar seguimiento a casos disciplinarios |
| **Planeación didáctica desorganizada** | Falta de continuidad en las secuencias didácticas |
| **Reportes administrativos complejos** | Horas dedicadas a llenar formatos institucionales |
| **Evaluación entre pares desestructurada** | Dificultad para implementar coevaluación objetiva |
| **Falta de respaldo de información** | Riesgo de perder datos importantes |

### Soluciones que Ofrece Arkhe Aula

- ✅ **Asistencia rápida** con un clic (Presente, Ausente, Retardo)
- ✅ **Cálculo automático** de promedios trimestrales y finales
- ✅ **Bitácora disciplinaria** centralizada por alumno
- ✅ **Planeación PDA** (Proyectos de Aula) integrada
- ✅ **Reportes automáticos** en PDF, Excel y Word
- ✅ **Evaluación 360°** con rúbricas personalizables
- ✅ **Respaldo automático** local y en la nube

---

## 3. Funciones Principales

### Módulos del Sistema

| Módulo | Qué Hace | Beneficio |
|--------|----------|-----------|
| **🏫 Grupos** | Gestión de grupos, alumnos y materias | Organización centralizada de toda la información escolar |
| **✅ Asistencia** | Pase de lista rápido con asistencia automática | Ahorra 10-15 minutos por clase |
| **📝 Evaluación** | Registro de calificaciones por rúbrica | Cálculo automático de promedios |
| **📋 Seguimiento PDA** | Planeación de Proyectos de Aula | Continuidad pedagógica documentada |
| **🎭 Conducta** | Registro de incidentes y comportamiento | Seguimiento disciplinario objetivo |
| **🧑‍🤝‍🧑 Equipos** | Organización de equipos para actividades | Facilita trabajo colaborativo |
| **🌐 Actividades Intergrupales** | Equipos con alumnos de varios grupos | Integra grupos paralelos |
| **⚠️ Incidentes** | Reporte formal de incidencias | Documentación oficial de casos |
| **📈 Reportes** | Generación de reportes PDF, Excel, Word | Ahorra horas de trabajo administrativo |
| **⚙️ Configuración** | Personalización del sistema | Se adapta a tu escuela |

### Características Destacadas

- **Multi-grupo:** Maneja todos tus grupos en una sola aplicación
- **Multi-trimestre:** Organización por trimestres escolares
- **Rúbricas personalizables:** Crea tus propios criterios de evaluación
- **Exportación múltiple:** PDF, Excel (.xlsx), Word (.docx)
- **Respaldo automático:** Backup local y sincronización en la nube
- **Interfaz intuitiva:** Diseño moderno y fácil de usar
- **Funciona offline:** No requiere internet para operar

---

## 4. Tipo de Sistema

### Clasificación Técnica

| Característica | Descripción |
|---------------|-------------|
| **Tipo de aplicación** | Aplicación de escritorio nativa |
| **Arquitectura** | Local-first (primero local, sincronización opcional) |
| **Conectividad** | Funciona 100% offline, sincronización opcional |
| **Plataformas** | Windows (10/11), macOS (10.12+) |
| **Tecnología base** | Electron + Vue.js + SQLite |
| **Instalación** | Instalador nativo (.exe, .dmg) o versión portable |

### Compatibilidad

| Sistema Operativo | Versión Mínima | Formato de Instalación |
|------------------|----------------|----------------------|
| Windows | Windows 10 | .exe (NSIS), Portable |
| macOS | macOS 10.12 (Sierra) | .dmg, .zip |
| Linux | No soportado oficialmente | — |

### Requisitos del Sistema

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| RAM | 4 GB | 8 GB |
| Almacenamiento | 500 MB libres | 1 GB libres |
| Procesador | Intel Core i3 o equivalente | Intel Core i5 o superior |
| Pantalla | 1280×720 | 1920×1080 |
| Internet | No requerido (opcional para sync) | Para respaldo en la nube |

---

## 5. Capturas de Pantalla

### Módulo de Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  📊 Dashboard                           👤 Prof. Juan   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Grupos    │  │  Alumnos    │  │  Asistencia │     │
│  │     12      │  │    384      │  │   95.2%     │     │
│  │   Activos   │  │  Inscritos  │  │   Promedio  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Accesos Rápidos                                │    │
│  │  [🏫 Grupos] [✅ Asistencia] [📝 Evaluación]   │    │
│  │  [📋 PDA] [🎭 Conducta] [📈 Reportes]          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Módulo de Asistencia
```
┌─────────────────────────────────────────────────────────┐
│  ✅ Tomar Asistencia — 7°A — 14/Mar/2026                │
├─────────────────────────────────────────────────────────┤
│  Alumno              │ Presente │ Ausente │ Retardo    │
│  ─────────────────────────────────────────────────────  │
│  Pérez García María │    ✓     │         │            │
│  López Hernández J. │          │    ✗    │            │
│  Ramírez Torres A.  │          │         │     ⏱      │
│  ...                │          │         │            │
│                                                          │
│  [Guardar] [Exportar Lista] [Ver Historial]             │
└─────────────────────────────────────────────────────────┘
```

### Módulo de Evaluación
```
┌─────────────────────────────────────────────────────────┐
│  📝 Evaluación — 7°A — Matemáticas                      │
├─────────────────────────────────────────────────────────┤
│  Rúbrica: Exámenes Trimestrales (40%)                  │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Actividad          │ Peso  │ Calificaciones           │
│  ─────────────────────────────────────────────────────  │
│  Examen T1          │ 100%  │ [8.5] [9.0] [7.5] [...]  │
│  Examen T2          │ 100%  │ [9.0] [8.5] [8.0] [...]  │
│  Examen T3          │ 100%  │ [--]  [--]  [--]  [...]  │
│                                                          │
│  Promedio Trimestre: 8.7                                │
│  [Guardar] [Exportar a Excel] [Imprimir Boleta]         │
└─────────────────────────────────────────────────────────┘
```

### Módulo de Reportes
```
┌─────────────────────────────────────────────────────────┐
│  📈 Reportes y Horario                                  │
├─────────────────────────────────────────────────────────┤
│  [🕒 Horario] [✅ Asistencia] [📝 Evaluación] [⚠️ Cali] │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Matriz de Calificaciones Insuficientes         │    │
│  │                                                  │    │
│  │  Alumno           │ Grupo │ Faltas │ Promedio  │    │
│  │  ────────────────────────────────────────────   │    │
│  │  García Luis      │ 7°A   │   8    │   5.2     │    │
│  │  Martínez Ana     │ 7°B   │   5    │   5.8     │    │
│  │  ...              │ ...   │  ...   │   ...     │    │
│  │                                                  │    │
│  │  [Exportar PDF] [Exportar Excel]                │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Módulo de Configuración
```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ Configuración                                       │
├─────────────────────────────────────────────────────────┤
│  [🏫 Escuela] [📅 Ciclos] [📚 Materias] [📊 Rúbricas]  │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Datos de la Escuela                                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Nombre:    Escuela Secundaria No. 1            │    │
│  │  CCT:       29DES0001A                          │    │
│  │  Director:  Dr. Roberto Sánchez                 │    │
│  │  Logo:      [Cargar Logo]                       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Respaldo y Sincronización                              │
│  [☁️ Configurar Nube] [💾 Exportar BD] [📥 Importar]   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Información de Contacto y Soporte

| Concepto | Información |
|----------|-------------|
| **Desarrollador** | Arkhe Group |
| **Sitio web** | https://arkhegroup.com |
| **Soporte técnico** | soporte@arkhegroup.com |
| **Documentación** | https://arkhegroup.com/docs |
| **Actualizaciones** | https://arkhegroup.com/updates/arkhe-aula/ |

---

## 7. Versión Actual

| Campo | Valor |
|-------|-------|
| **Versión** | 1.12.7 |
| **Fecha de release** | Marzo 2026 |
| **Build** | Stable |
| **Licencia** | Propietaria - Arkhe Group © 2026 |

---

*Documento generado para Arkhe Aula v1.12.7 — Arkhe Group © 2026*
