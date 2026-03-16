# Skill: Instrucciones

## Propósito
Este skill contiene las instrucciones exactas para arrancar el servidor local, instalar dependencias y configurar el entorno de desarrollo de Arkhe Aula.

## Requisitos Previos

### Software Requerido
| Software | Versión Mínima | Propósito |
|----------|---------------|-----------|
| Node.js | 18.x | Runtime de JavaScript |
| npm | 9.x | Gestor de paquetes |
| Git | 2.x | Control de versiones |

### Verificar Instalación
```bash
node --version    # Debe mostrar v18.x o superior
npm --version     # Debe mostrar 9.x o superior
git --version     # Debe mostrar 2.x o superior
```

## Instalación del Proyecto

### 1. Clonar Repositorio (si aplica)
```bash
git clone <url-del-repositorio>
cd Arke_Software
```

### 2. Instalar Dependencias
```bash
npm install
```

Este comando instalará:
- Dependencias de desarrollo (Vite, Electron, TypeScript, etc.)
- Dependencias de producción (Vue, Pinia, better-sqlite3, etc.)
- Ejecutará el script `postinstall` para dependencias de Electron

### 3. Verificar Instalación
```bash
# Verificar que node_modules existe
ls -la node_modules

# Verificar paquetes instalados
npm list --depth=0
```

## Arrancar Servidor Local (Modo Desarrollo)

### Opción 1: Desarrollo Completo (Recomendado)
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

### Opción 2: Solo Vite (Frontend)
```bash
npm run dev:vite
```
- Inicia solo el servidor de desarrollo de Vite
- Útil para desarrollar UI sin Electron
- Acceso: `http://localhost:5173`

### Opción 3: Desarrollo con iPad/Dispositivos
```bash
npm run dev:ipad
```
- Inicia Vite con `--host` para acceso en red local
- Permite probar en dispositivos móviles/tablets
- Electron se inicia automáticamente

### Opción 4: Solo Electron (Requiere Vite corriendo)
```bash
npm run dev:electron
```
- Solo inicia Electron (asume Vite ya está corriendo)
- Útil para reiniciar Electron sin reiniciar Vite

## Estructura de Comandos npm

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

## Configuración del Entorno

### Variables de Entorno
El proyecto usa `cross-env` para variables de entorno multiplataforma.

```bash
# Desarrollo
NODE_ENV=development

# Producción
NODE_ENV=production
```

### Configuración de Vite
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

### Alias de Rutas
```typescript
'@/' → 'src/'
```

Uso en código:
```typescript
import Component from '@/components/Component.vue'
```

## Solución de Problemas Comunes

### Puerto 5173 Ocupado
```bash
# Matar proceso usando el puerto
lsof -ti:5173 | xargs kill -9

# O cambiar puerto en vite.config.ts
```

### Error: "Cannot find module 'electron'"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error en better-sqlite3
```bash
# Rebuild de dependencias nativas
npm rebuild better-sqlite3

# O reinstalar
rm -rf node_modules
npm install
```

### Electron no se inicia
```bash
# Verificar que Vite esté corriendo
npm run dev:vite

# En otra terminal, iniciar Electron manualmente
npm run dev:electron
```

### Error de Permisos en macOS
```bash
# Dar permisos de ejecución
chmod +x node_modules/.bin/*
```

### Error: "asar is not a valid keyword"
```bash
# Limpiar caché de npm
npm cache clean --force
npm install
```

---

## Sistema de Logging

### Ubicación de Logs
Los logs de transacciones se guardan en la carpeta `log/`:
- **Desarrollo:** `log/transactions_YYYY-MM-DD.log`
- **Producción:** `{userData}/log/transactions_YYYY-MM-DD.log`

### Formato de Logs
Cada entrada es un objeto JSON con:
```json
{
  "timestamp": "2026-03-13T12:00:00.000Z",
  "type": "INFO|SUCCESS|ERROR|WARNING|DB|IPC|AUTH",
  "module": "nombre-del-modulo",
  "action": "accion-realizada",
  "data": {},
  "user": "usuario"
}
```

### Tipos de Log
| Tipo | Descripción |
|------|-------------|
| `INFO` | Información general |
| `SUCCESS` | Operación exitosa |
| `ERROR` | Error ocurrido |
| `WARNING` | Advertencia |
| `DB` | Operaciones de base de datos |
| `IPC` | Llamadas entre procesos |
| `AUTH` | Eventos de autenticación |

### Consultar Logs
```javascript
const logger = require('./electron/logger');

// Logs de hoy
const todayLogs = logger.getLogsByDate('2026-03-13');

// Últimos 7 días
const recentLogs = logger.getRecentLogs(7);

// Buscar por criterio
const errors = logger.searchLogs({ type: 'ERROR' });
const dbLogs = logger.searchLogs({ type: 'DB' });
const userLogs = logger.searchLogs({ user: 'admin' });
```

### Exportar Logs
```javascript
// Exportar logs recientes
logger.exportLogs('./backup-logs.json');

// Exportar logs específicos
logger.exportLogs('./error-logs.json', errorLogs);
```

### Limpieza Automática
- Los logs mayores a 30 días se eliminan automáticamente
- Se crea un nuevo archivo cada día

## Comandos y Flujos de Trabajo

### Inicio de Jornada
```bash
# 1. Asegurarse de estar en la rama correcta
git checkout develop

# 2. Actualizar dependencias si hubo cambios
git pull
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

### Durante el Desarrollo
- Los cambios en `src/` se reflejan automáticamente (hot-reload)
- Los cambios en `electron/` reinician Electron automáticamente
- Verificar consola de Vite y Electron para errores
- **Los logs de transacciones se guardan en `log/`**

### Fin de Jornada
```bash
# 1. Guardar cambios
git add .
git commit -m "feat: descripción del cambio"

# 2. (Opcional) Push a repositorio
git push origin develop
```

## Depuración

### DevTools de Electron
```typescript
// Habilitar DevTools en electron/main.js
mainWindow.webContents.openDevTools();
```

### Consola de Vite
- Ver terminal donde se ejecutó `npm run dev`
- Errores de compilación aparecen aquí

### Consola del Renderer
```typescript
// En componentes Vue
console.log('Mensaje desde renderer')
```

### Consola del Main Process
```javascript
// En electron/main.js
console.log('Mensaje desde main process')
```

## Recursos Adicionales

### Documentación
- [Vite](https://vitejs.dev/)
- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)

### Herramientas Útiles
- **Vue DevTools** - Extensión de navegador para debuggear Vue
- **Electron DevTools** - Integrada en la aplicación
