# Arkhe Aula — Manual del Usuario

## Índice

1. [Introducción](#1-introducción)
2. [Instalación](#2-instalación)
3. [Primeros Pasos](#3-primeros-pasos)
4. [Módulo de Grupos](#4-módulo-de-grupos)
5. [Módulo de Asistencia](#5-módulo-de-asistencia)
6. [Módulo de Evaluación](#6-módulo-de-evaluación)
7. [Módulo de Planeación PDA](#7-módulo-de-planeación-pda)
8. [Módulo de Conducta](#8-módulo-de-conducta)
9. [Módulo de Equipos](#9-módulo-de-equipos)
10. [Módulo de Incidentes](#10-módulo-de-incidentes)
11. [Módulo de Reportes](#11-módulo-de-reportes)
12. [Configuración](#12-configuración)
13. [Respaldo y Sincronización](#13-respaldo-y-sincronización)
14. [Preguntas Frecuentes](#14-preguntas-frecuentes)
15. [Soporte Técnico](#15-soporte-técnico)

---

## 1. Introducción

### ¿Qué es Arkhe Aula?

Arkhe Aula es un sistema de evaluación docente para escritorio que te ayuda a gestionar todo el proceso administrativo de tu práctica docente:

- ✅ Control de asistencia rápido
- ✅ Registro y cálculo automático de calificaciones
- ✅ Planeación de Proyectos de Aula (PDA)
- ✅ Seguimiento de conducta e incidentes
- ✅ Generación de reportes automáticos
- ✅ Organización de equipos de trabajo

### Requisitos del Sistema

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| Sistema Operativo | Windows 10 / macOS 10.12 | Windows 11 / macOS 12+ |
| RAM | 4 GB | 8 GB |
| Almacenamiento | 500 MB libres | 1 GB libres |
| Pantalla | 1280×720 | 1920×1080 |
| Internet | No requerido | Para actualizaciones y sync |

### Convenciones del Manual

| Símbolo | Significado |
|---------|-------------|
| 💡 | Consejo o tip útil |
| ⚠️ | Advertencia importante |
| ✅ | Función completada/exitosa |
| ❌ | Error o acción no recomendada |
| 📝 | Nota adicional |

---

## 2. Instalación

### Windows

#### Opción A: Instalador (Recomendado)

1. **Descarga el instalador:**
   - Ve a https://arkhegroup.com/updates/arkhe-aula/
   - Descarga `Arkhe Aula Setup 1.12.7.exe`

2. **Ejecuta el instalador:**
   - Haz doble clic en el archivo descargado
   - Si Windows pregunta por permisos, haz clic en "Sí"

3. **Sigue el asistente:**
   - Acepta los términos de licencia
   - Elige la carpeta de instalación (por defecto: `C:\Program Files\Arkhe Aula`)
   - Selecciona si deseas crear accesos directos
   - Haz clic en "Instalar"

4. **Completa la instalación:**
   - Espera a que termine la instalación (~2-3 minutos)
   - Haz clic en "Finalizar"
   - Opcional: Marca "Ejecutar Arkhe Aula" para abrirlo inmediatamente

#### Opción B: Versión Portable

1. **Descarga la versión portable:**
   - Ve a https://arkhegroup.com/updates/arkhe-aula/
   - Descarga `Arkhe Aula-Portable-1.12.7.exe`

2. **Ejecuta directamente:**
   - No requiere instalación
   - Puedes llevarlo en una memoria USB
   - Funciona igual que la versión instalada

### macOS

#### Opción A: DMG (Recomendado)

1. **Descarga el DMG:**
   - Ve a https://arkhegroup.com/updates/arkhe-aula/
   - Descarga `Arkhe Aula-1.12.7.dmg`

2. **Abre el DMG:**
   - Haz doble clic en el archivo descargado
   - Se montará una imagen de disco

3. **Instala la aplicación:**
   - Arrastra el ícono de Arkhe Aula a la carpeta "Aplicaciones"
   - Espera a que se complete la copia

4. **Ejecuta la aplicación:**
   - Ve a la carpeta Aplicaciones
   - Haz clic en "Arkhe Aula"
   - Si macOS muestra una advertencia de desarrollador no identificado:
     - Ve a Preferencias del Sistema → Seguridad y Privacidad
     - Haz clic en "Abrir de todos modos"

#### Opción B: ZIP (Portable)

1. **Descarga el ZIP:**
   - Ve a https://arkhegroup.com/updates/arkhe-aula/
   - Descarga `Arkhe Aula-1.12.7-mac.zip`

2. **Descomprime:**
   - Haz doble clic en el archivo ZIP
   - Se creará una carpeta con la aplicación

3. **Ejecuta:**
   - Mueve la aplicación a donde prefieras
   - Haz doble clic para ejecutar

### Primer Inicio

1. **Abre Arkhe Aula** desde el acceso directo o menú de aplicaciones

2. **Crea tu cuenta de administrador:**
   - Ingresa tu nombre completo
   - Ingresa tu correo electrónico
   - Crea una contraseña segura (mínimo 6 caracteres)
   - Selecciona tu rol (generalmente "Docente")
   - Haz clic en "Registrarse"

3. **¡Listo!** Ya puedes comenzar a usar Arkhe Aula

---

## 3. Primeros Pasos

### El Dashboard

Al iniciar, verás el **Dashboard** (pantalla principal):

```
┌─────────────────────────────────────────────────────────┐
│  📊 Dashboard                           👤 [Tu Nombre]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Grupos    │  │  Alumnos    │  │  Asistencia │     │
│  │     X       │  │    XXX      │  │   XX.X%     │     │
│  │   Activos   │  │  Inscritos  │  │   Promedio  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Accesos Rápidos                                │    │
│  │  [🏫 Grupos] [✅ Asistencia] [📝 Evaluación]   │    │
│  │  [📋 PDA] [🎭 Conducta] [📈 Reportes]          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Próximas Actividades                           │    │
│  │  • Toma de asistencia — 7°A — 10:00 AM         │    │
│  │  • Cierre de evaluación T1 — 15/Mar            │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Menú de Navegación

El menú lateral izquierdo te permite navegar entre todos los módulos:

| Ícono | Módulo | Descripción |
|-------|--------|-------------|
| 📊 | Dashboard | Vista general y estadísticas |
| 🏫 | Grupos | Gestión de grupos y alumnos |
| ✅ | Asistencia | Pase de lista diario |
| 📋 | Seguimiento PDA | Planeación didáctica |
| 📝 | Evaluación | Calificaciones y rúbricas |
| 🎭 | Conducta | Registro de comportamiento |
| 🧑‍🤝‍🧑 | Equipos | Organización de equipos |
| 🌐 | Actividades Intergrupales | Equipos multi-grupo |
| ⚠️ | Incidentes | Reporte de incidencias |
| 📈 | Reportes | Generación de reportes |
| ⚙️ | Configuración | Ajustes del sistema |

### Barra Superior

La barra superior contiene:

- **Buscador:** Encuentra alumnos, grupos, o actividades rápidamente
- **Notificaciones:** Alertas y recordatorios importantes
- **Perfil:** Acceso a tu perfil y cierre de sesión

---

## 4. Módulo de Grupos

### Crear un Nuevo Grupo

1. **Ve a Grupos** desde el menú lateral

2. **Haz clic en "➕ Nuevo Grupo"**

3. **Completa la información:**
   - **Grado:** 1°, 2°, 3°, etc.
   - **Nombre del grupo:** A, B, C, etc.
   - **Ciclo escolar:** 2025-2026
   - **Turno:** Matutino, Vespertino
   - **Descripción:** (Opcional)

4. **Haz clic en "Crear Grupo"**

### Agregar Alumnos a un Grupo

1. **Selecciona el grupo** desde la lista de grupos

2. **Haz clic en "➕ Agregar Alumno"**

3. **Completa los datos del alumno:**
   - Nombre(s)
   - Apellido paterno
   - Apellido materno
   - Fecha de inscripción
   - Estatus (Activo, Baja, etc.)

4. **Haz clic en "Guardar"**

### Importar Alumnos desde Excel

1. **Prepara tu archivo Excel:**
   - Columnas requeridas: `first_name`, `paternal_surname`, `maternal_surname`
   - Columnas opcionales: `enrolled_at`, `student_status_id`

2. **Ve a Grupos → Selecciona el grupo**

3. **Haz clic en "📥 Importar desde Excel"**

4. **Selecciona tu archivo Excel**

5. **Revisa la vista previa** y confirma la importación

### Editar un Grupo

1. **Selecciona el grupo** que deseas editar

2. **Haz clic en el ícono de lápiz (✏️)**

3. **Modifica la información** que necesites

4. **Haz clic en "Guardar Cambios"**

### Archivar/Restaurar un Grupo

**Archivar:**
1. Selecciona el grupo
2. Haz clic en "🗑️ Archivar"
3. Confirma la acción

**Restaurar:**
1. Ve a la pestaña "Archivados"
2. Selecciona el grupo
3. Haz clic en "📥 Restaurar"

---

## 5. Módulo de Asistencia

### Tomar Asistencia

1. **Ve a Asistencia** desde el menú lateral

2. **Selecciona el grupo** del cual tomarás asistencia

3. **La fecha se selecciona automáticamente** (día actual)
   - Puedes cambiar la fecha si necesitas registrar asistencia de otro día

4. **Registra la asistencia de cada alumno:**
   - ✅ **Presente:** El alumno asistió
   - ❌ **Ausente:** El alumno faltó
   - ⏱ **Retardo:** El alumno llegó tarde

5. **Haz clic en "💾 Guardar Asistencia"**

### Ver Historial de Asistencia

1. **Ve a Asistencia → Historial**

2. **Selecciona el grupo y el rango de fechas**

3. **Visualiza el reporte:**
   - Días presentes, ausentes y retardos
   - Porcentaje de asistencia
   - Total de faltas

### Reporte de Asistencia

1. **Ve a Asistencia → Reporte**

2. **Selecciona:**
   - Grupo
   - Trimestre o rango de fechas

3. **Elige el formato de exportación:**
   - 📄 PDF
   - 📊 Excel

4. **Haz clic en "Exportar"**

---

## 6. Módulo de Evaluación

### Configurar Rúbricas de Evaluación

1. **Ve a Configuración → Evaluación Formativa**

2. **Haz clic en "➕ Nueva Rúbrica"**

3. **Completa la información:**
   - **Nombre:** Ej. "Exámenes Trimestrales"
   - **Porcentaje:** Ej. 40%
   - **Grupos:** Selecciona los grupos que aplica
   - **Materias:** Selecciona las materias
   - **Trimestres:** I, II, III (puedes seleccionar múltiples)
   - **¿Es extra?:** No (las rúbricas extra no afectan el promedio base)

4. **Haz clic en "Crear"**

### Agregar Actividades a una Rúbrica

1. **Ve a Configuración → Actividades**

2. **Haz clic en "➕ Nueva Actividad"**

3. **Completa la información:**
   - **Nombre:** Ej. "Examen Trimestre 1"
   - **Rúbrica:** Selecciona la rúbrica correspondiente
   - **Grupos, Materias, Trimestres:** Selecciona los correspondientes

4. **Haz clic en "Crear"**

### Registrar Calificaciones

1. **Ve a Evaluación** desde el menú lateral

2. **Selecciona el grupo**

3. **Selecciona la materia**

4. **Verás la lista de rúbricas y actividades configuradas**

5. **Captura las calificaciones** de cada alumno:
   - Las calificaciones van de 0 a 10
   - Puedes usar decimales (ej. 8.5)

6. **El sistema calcula automáticamente:**
   - Promedio por actividad
   - Promedio por rúbrica
   - Promedio trimestral
   - Promedio final

7. **Haz clic en "💾 Guardar Calificaciones"**

### Ver Boleta de Calificaciones

1. **Ve a Evaluación → Boletas**

2. **Selecciona:**
   - Grupo
   - Alumno (o todos)
   - Trimestre

3. **Elige el formato:**
   - 📄 PDF (para imprimir)
   - 📊 Excel (para análisis)

4. **Haz clic en "Exportar"**

---

## 7. Módulo de Planeación PDA

### Crear un Proyecto de Aula (PDA)

1. **Ve a Seguimiento PDA** desde el menú lateral

2. **Haz clic en "➕ Nuevo PDA"**

3. **Completa la información:**
   - **Grupo:** Selecciona el grupo
   - **Materia:** Selecciona la materia
   - **Nombre del PDA:** Ej. "Fracciones y Decimales"
   - **Descripción:** Describe el proyecto
   - **Número de sesiones:** Ej. 5
   - **Fecha de inicio:** Selecciona la fecha
   - **Fecha de fin:** Selecciona la fecha

4. **Haz clic en "Crear PDA"**

### Editar un PDA

1. **Selecciona el PDA** de la lista

2. **Haz clic en "✏️ Editar"**

3. **Modifica la información** que necesites

4. **Haz clic en "Guardar Cambios"**

### Dar Seguimiento a las Sesiones

1. **Selecciona el PDA**

2. **Ve a la pestaña "Sesiones"**

3. **Registra el avance de cada sesión:**
   - Fecha
   - Tema de la sesión
   - Logros alcanzados
   - Observaciones

4. **Haz clic en "Guardar"**

---

## 8. Módulo de Conducta

### Registrar Comportamiento

1. **Ve a Conducta** desde el menú lateral

2. **Selecciona el grupo**

3. **Selecciona la fecha**

4. **Para cada alumno, selecciona el comportamiento:**
   - 😊 **Excelente:** Sobresalió positivamente
   - 👍 **Bueno:** Comportamiento adecuado
   - 😐 **Regular:** Necesita mejorar
   - 👎 **Malo:** Comportamiento inadecuado
   - ⚠️ **Muy Malo:** Falta grave

5. **Agrega comentarios** si es necesario

6. **Haz clic en "Guardar"**

### Ver Reporte de Conducta

1. **Ve a Conducta → Reporte**

2. **Selecciona:**
   - Grupo
   - Alumno (opcional, para ver uno específico)
   - Trimestre o rango de fechas

3. **Visualiza el reporte:**
   - Comportamientos por alumno
   - Tendencias
   - Estadísticas del grupo

---

## 9. Módulo de Equipos

### Configurar Equipos para una Actividad

1. **Ve a Equipos** desde el menú lateral

2. **Haz clic en "➕ Nuevo Equipo"**

3. **Selecciona:**
   - Trimestre
   - Grupo
   - Materia
   - Evaluación Formativa (Rúbrica)
   - Actividad específica

4. **El sistema cargará la lista de alumnos**

5. **Organiza los equipos:**
   - Haz clic en los números 1-10 para asignar a cada alumno
   - Todos los alumnos con el mismo número forman un equipo

6. **Completa la información de cada equipo:**
   - **Tema:** Tema que trabajará el equipo
   - **Comentarios:** Observaciones adicionales

7. **Haz clic en "💾 Guardar Cambios"**

### Ver Equipos Configurados

1. **Ve a Equipos** (vista de lista)

2. **Verás todas las actividades con equipos configurados**

3. **Haz clic en cualquier actividad** para ver/editar los equipos

### Exportar Lista de Equipos

1. **Selecciona la actividad** con equipos configurados

2. **Haz clic en "📄 Exportar a DOCX"**

3. **Se generará un documento Word** con:
   - Lista de equipos
   - Integrantes de cada equipo
   - Temas asignados

---

## 10. Módulo de Incidentes

### Crear un Incidente

1. **Ve a Incidentes** desde el menú lateral

2. **Haz clic en "➕ Nuevo Incidente"**

3. **Completa la información:**
   - **Alumno:** Selecciona el alumno involucrado
   - **Grupo:** Se selecciona automáticamente
   - **Tipo de incidente:** Selecciona de la lista (o crea uno nuevo)
   - **Descripción:** Describe detalladamente el incidente
   - **Fecha:** Fecha del incidente
   - **Gravedad:** Leve, Grave, Muy Grave
   - **Acciones tomadas:** Qué se hizo al respecto
   - **Seguimiento:** Acciones pendientes o recomendadas

4. **Haz clic en "Crear Incidente"**

### Ver Historial de Incidentes

1. **Ve a Incidentes → Historial**

2. **Filtra por:**
   - Alumno
   - Grupo
   - Tipo de incidente
   - Rango de fechas
   - Gravedad

3. **Visualiza la lista** de incidentes

### Exportar Reporte de Incidentes

1. **Selecciona el incidente** o filtra la lista

2. **Haz clic en "📄 Exportar"**

3. **Elige el formato:**
   - PDF (para imprimir y firmar)
   - Word (para editar)

---

## 11. Módulo de Reportes

### Tipos de Reportes Disponibles

| Reporte | Descripción | Formatos |
|---------|-------------|----------|
| **Horario** | Visualiza tu horario semanal | Vista en pantalla |
| **Asistencia** | Reporte de asistencias y faltas | PDF, Excel |
| **Evaluación** | Estadísticas de calificaciones | PDF, Excel |
| **Cali. Insuficiente** | Alumnos con calificación reprobatoria | PDF, Excel |
| **Conducta** | Reporte de comportamientos | PDF, Excel |
| **Incidentes** | Listado de incidentes | PDF, Word |

### Generar un Reporte

1. **Ve a Reportes** desde el menú lateral

2. **Selecciona la pestaña** del reporte que necesitas

3. **Configura los filtros:**
   - Grupo
   - Alumno (si aplica)
   - Fecha o rango de fechas
   - Trimestre (si aplica)

4. **Haz clic en "🔄 Generar" o "📊 Exportar"**

5. **Elige el formato** (PDF o Excel)

6. **El archivo se descargará** en tu carpeta de descargas

### Reporte de Calificaciones Insuficientes

Este reporte es especialmente útil para identificar alumnos en riesgo:

1. **Ve a Reportes → Cali. Insuficiente**

2. **Selecciona:**
   - Ciclo escolar
   - Trimestre

3. **El sistema mostrará:**
   - Lista de alumnos con promedio < 6.0
   - Número de faltas
   - Promedio final
   - Grupo

4. **Puedes:**
   - Filtrar por nombre, grupo, o calificación
   - Ordenar por cualquier columna
   - Exportar a PDF o Excel

---

## 12. Configuración

### Datos de la Escuela

1. **Ve a Configuración → Escuela**

2. **Completa la información:**
   - Nombre de la escuela
   - CCT (Clave del Centro de Trabajo)
   - Nombre del director
   - Logo de la escuela (opcional)

3. **Haz clic en "💾 Guardar"**

### Ciclos Escolares

#### Crear un Nuevo Ciclo

1. **Ve a Configuración → Ciclos**

2. **Haz clic en "➕ Nuevo Ciclo"**

3. **Completa:**
   - Nombre: Ej. "2025-2026"
   - Fecha de inicio
   - Fecha de fin
   - Marcar como activo (si es el ciclo actual)

4. **Haz clic en "Crear"**

### Materias

#### Crear una Nueva Materia

1. **Ve a Configuración → Materias**

2. **Haz clic en "➕ Nueva Materia"**

3. **Completa:**
   - Nombre de la materia
   - Color (para identificación visual)
   - Grupos donde se imparte

4. **Haz clic en "Crear"**

### Trimestres

#### Configurar Fechas de Trimestres

1. **Ve a Configuración → Trimestres**

2. **Selecciona el ciclo escolar**

3. **Para cada trimestre (I, II, III):**
   - Fecha de inicio
   - Fecha de fin

4. **Haz clic en "💾 Guardar Fechas"**

### Configuración de Calificaciones

1. **Ve a Configuración → Calificaciones**

2. **Configura:**
   - **Calificación máxima:** Generalmente 10
   - **Calificación mínima aprobatoria:** Generalmente 6
   - **Número de períodos:** Generalmente 3 (trimestres)

3. **Haz clic en "💾 Guardar"**

### Respaldo de Base de Datos

#### Exportar Base de Datos

1. **Ve a Configuración → Base de Datos**

2. **Haz clic en "📤 Exportar Base de Datos"**

3. **Selecciona dónde guardar** el archivo `.db`

4. **Confirma la exportación**

#### Importar Base de Datos

⚠️ **Advertencia:** Esto reemplazará TODA la base de datos actual.

1. **Ve a Configuración → Base de Datos**

2. **Haz clic en "📥 Importar Base de Datos"**

3. **Selecciona el archivo `.db`** a importar

4. **Confirma que deseas reemplazar** la base de datos actual

5. **Reinicia la aplicación** para aplicar los cambios

---

## 13. Respaldo y Sincronización

### Respaldo Automático

1. **Ve a Configuración → Respaldo Automático**

2. **Activa el respaldo automático:**
   - Marca "Activar respaldo automático"
   - Selecciona la carpeta de destino
   - Configura la frecuencia (diario, semanal)

3. **Haz clic en "Guardar"**

### Respaldo Manual

1. **Ve a Configuración → Respaldo**

2. **Haz clic en "💾 Crear Respaldo Ahora"**

3. **Selecciona la ubicación** para guardar el respaldo

4. **Confirma la creación**

### Sincronización en la Nube (Próximamente)

La sincronización en la nube te permitirá:
- Acceder a tus datos desde múltiples dispositivos
- Tener un respaldo automático en internet
- Compartir información con otros docentes

**Proveedores soportados (próximamente):**
- Google (Firebase)
- Apple (CloudKit)
- Microsoft (OneDrive)

---

## 14. Preguntas Frecuentes

### General

**¿Necesito internet para usar Arkhe Aula?**
No, Arkhe Aula funciona 100% offline. Solo necesitas internet para:
- Descargar actualizaciones
- Sincronizar con la nube (cuando esté disponible)

**¿Puedo usar Arkhe Aula en múltiples computadoras?**
Sí, pero la base de datos es local. Para usar los mismos datos en otra computadora, debes exportar/importar la base de datos o usar la sincronización en la nube.

**¿Mis datos están seguros?**
Sí, tus datos se almacenan localmente en tu computadora y no se comparten con nadie sin tu permiso.

### Grupos y Alumnos

**¿Cuántos grupos puedo crear?**
No hay límite práctico. El sistema puede manejar 50+ grupos sin problemas.

**¿Cuántos alumnos puedo registrar por grupo?**
No hay límite. El sistema está diseñado para manejar grupos de 20-50 alumnos eficientemente.

**¿Puedo mover alumnos entre grupos?**
Sí, puedes editar el grupo de un alumno en cualquier momento.

### Evaluación

**¿Puedo cambiar las calificaciones después de guardar?**
Sí, puedes editar cualquier calificación en cualquier momento.

**¿Qué pasa si me equivoco en un promedio?**
El sistema calcula automáticamente. Si corriges una calificación, los promedios se actualizan solos.

**¿Puedo crear mis propias rúbricas?**
Sí, puedes crear rúbricas personalizadas con los porcentajes que necesites.

### Asistencia

**¿Puedo registrar asistencia de días pasados?**
Sí, puedes seleccionar cualquier fecha para registrar asistencia.

**¿Qué pasa si un alumno se da de baja?**
El alumno permanece en el historial pero ya no aparece en la lista de asistencia activa.

### Soporte Técnico

**¿Qué hago si el programa no abre?**
1. Reinicia tu computadora
2. Verifica que tengas la última versión
3. Si el problema persiste, contacta a soporte

**¿Cómo actualizo Arkhe Aula?**
El programa verifica actualizaciones automáticamente al iniciar. También puedes ir a Perfil → Buscar actualizaciones.

**¿Dónde puedo obtener ayuda?**
- Documentación: https://arkhegroup.com/docs
- Email: soporte@arkhegroup.com

---

## 15. Soporte Técnico

### Canales de Soporte

| Canal | Contacto | Tiempo de Respuesta |
|-------|----------|--------------------|
| **Email** | soporte@arkhegroup.com | 24-48 horas hábiles |
| **Documentación** | https://arkhegroup.com/docs | Inmediato |
| **Actualizaciones** | Automáticas | — |

### Información para Solicitar Soporte

Cuando contactes a soporte, incluye:

1. **Versión de Arkhe Aula:** (Ve a Perfil → Acerca de)
2. **Sistema operativo:** Windows 10, macOS 12, etc.
3. **Descripción del problema:** Sé lo más específico posible
4. **Pasos para reproducir:** ¿Qué hiciste antes del problema?
5. **Capturas de pantalla:** Si es relevante

### Horario de Soporte

- **Lunes a Viernes:** 9:00 AM - 6:00 PM (Hora Centro México)
- **Sábados, Domingos y Festivos:** Sin soporte

### Política de Actualizaciones

- **Actualizaciones menores (patches):** Gratuitas
- **Actualizaciones de versión (minor):** Gratuitas mientras tu suscripción esté activa
- **Actualizaciones mayores (major):** Pueden tener costo adicional

---

*Manual del Usuario de Arkhe Aula v1.12.7 — Arkhe Group © 2026*
