# Histórico de Contexto - 2026-03-13 (Logging y Testing)

## Fecha: 13 de Marzo, 2026

---

## Actualización: Sistema de Logging y Testing

### Descripción
Se implementó un sistema completo de logging de transacciones y se configuró el entorno de testing para la aplicación Arkhe Aula.

---

## 1. Sistema de Logging Implementado

### Archivo Creado: `electron/logger.js`

**Propósito:** Registrar todas las transacciones de la aplicación en archivos log diarios.

### Características Principales

#### Ubicación de Logs
- **Desarrollo:** `log/transactions_YYYY-MM-DD.log`
- **Producción:** `{userData}/log/transactions_YYYY-MM-DD.log`

#### Formato de Logs
Cada entrada es un objeto JSON:
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

#### Tipos de Log Disponibles
| Tipo | Método | Descripción |
|------|--------|-------------|
| `INFO` | `logInfo()` | Información general |
| `SUCCESS` | `logSuccess()` | Operación exitosa |
| `ERROR` | `logError()` | Error ocurrido |
| `WARNING` | `logWarning()` | Advertencia |
| `DB` | `logDB()` | Operaciones de base de datos |
| `IPC` | `logIPC()` | Llamadas entre procesos |
| `AUTH` | `logAuth()` | Eventos de autenticación |

#### Métodos Exportados

**Método General:**
```javascript
logger.log(type, module, action, data, user)
```

**Métodos Específicos:**
```javascript
logger.logDB(action, table, data, user)
logger.logIPC(channel, data, user)
logger.logAuth(action, email, user)
logger.logInfo(module, action, data, user)
logger.logSuccess(module, action, data, user)
logger.logError(module, action, error, user)
logger.logWarning(module, action, data, user)
```

**Utilidades:**
```javascript
logger.getLogsByDate(date)        // Logs de una fecha específica
logger.getRecentLogs(days)        // Últimos N días (default: 7)
logger.searchLogs(criteria)       // Búsqueda por criterios
logger.cleanupOldLogs(days)       // Eliminar logs antiguos
logger.exportLogs(destPath, logs) // Exportar logs a archivo
```

### Integración en la Aplicación

#### main.js
```javascript
const logger = require('./logger');

app.whenReady().then(() => {
  logger.initLogger();
  logger.logInfo('main', 'Aplicación iniciada');
  // ...
});
```

#### ipc-handlers.js
```javascript
const logger = require('./logger');

ipcMain.handle('auth-login', async (_, { email, password }) => {
  logger.logIPC('auth-login', { email }, 'system');
  // ... lógica de autenticación
  logger.logAuth('login-success', email, user.name);
  return { success: true, user: userSafe };
});
```

### Características Automáticas

1. **Limpieza automática:** Logs mayores a 30 días se eliminan cada 24 horas
2. **Rotación diaria:** Nuevo archivo de log cada día
3. **Log en consola:** En modo desarrollo, los logs también se muestran en consola con colores
4. **Seguridad:** No se loggean contraseñas ni datos sensibles

---

## 2. Sistema de Testing Configurado

### Dependencias Instaladas

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8 happy-dom
npm install -D @vue/test-utils @testing-library/vue @testing-library/jest-dom
```

### Archivos de Configuración Creados

#### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

#### `tests/setup.ts`
```typescript
import '@testing-library/jest-dom'
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

config.global.plugins = [createPinia()]
```

### Scripts Agregados a package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Tests de Ejemplo Creados

#### `tests/config.test.ts`
Tests básicos para verificar la configuración de Vitest:
- Test de funcionamiento básico
- Test de operaciones simples
- Test con arrays

#### `src/stores/toast.test.ts`
Tests para el store de Toast:
- Inicialización del store
- Agregar toasts (success, error, warning, info)
- Eliminar toasts

### Resultados de Tests

```
✓ src/stores/toast.test.ts (6 tests) 5ms
  ✓ useToastStore (6)
    ✓ debe inicializar el store correctamente 2ms
    ✓ debe agregar un toast success 1ms
    ✓ debe agregar un toast error 0ms
    ✓ debe agregar un toast warning 0ms
    ✓ debe agregar un toast info 0ms
    ✓ debe eliminar un toast 0ms

Test Files  1 passed (1)
Tests  6 passed (6)
```

### Comandos para Correr Tests

```bash
# Correr tests en modo watch (desarrollo)
npm run test

# Correr tests una vez (CI/CD)
npm run test:run

# Correr tests con interfaz gráfica
npm run test:ui

# Correr tests con reporte de cobertura
npm run test:coverage
```

---

## 3. Actualización de Skills

### `AgenteIA/skills/instrucciones.md`

**Agregado:** Sección completa "Sistema de Logging"

**Contenido nuevo:**
- Ubicación de logs (desarrollo y producción)
- Formato de logs JSON
- Tipos de log disponibles
- Cómo consultar logs
- Cómo exportar logs
- Limpieza automática

**Actualizado:** Flujo de trabajo de desarrollo
- Mención de que los logs se guardan en `log/`

---

## 4. Estructura de Carpetas Actualizada

```
Arke_Software/
├── log/                          # ✨ NUEVA: Logs de transacciones
│   └── transactions_2026-03-13.log
├── tests/                        # ✨ NUEVA: Tests de la aplicación
│   ├── setup.ts
│   └── config.test.ts
├── electron/
│   ├── logger.js                 # ✨ NUEVO: Sistema de logging
│   ├── main.js                   # Actualizado con logging
│   └── ipc-handlers.js           # Actualizado con logging
├── src/
│   └── stores/
│       └── toast.test.ts         # ✨ NUEVO: Test del toast store
├── vitest.config.ts              # ✨ NUEVO: Configuración de Vitest
├── package.json                  # Actualizado con scripts de test
└── AgenteIA/
    └── skills/
        └── instrucciones.md      # Actualizado con info de logging
```

---

## 5. Archivos Creados/Modificados

### Archivos Nuevos
| Archivo | Propósito |
|---------|-----------|
| `electron/logger.js` | Sistema de logging de transacciones |
| `vitest.config.ts` | Configuración de Vitest |
| `tests/setup.ts` | Setup para tests |
| `tests/config.test.ts` | Tests de configuración |
| `src/stores/toast.test.ts` | Tests del toast store |
| `log/` | Carpeta para logs |

### Archivos Modificados
| Archivo | Cambios |
|---------|---------|
| `electron/main.js` | Integración del logger |
| `electron/ipc-handlers.js` | Logging en autenticación |
| `package.json` | Scripts de testing |
| `AgenteIA/skills/instrucciones.md` | Documentación de logging |

---

## 6. Comandos Disponibles

### Testing
```bash
# Desarrollo (watch mode)
npm run test

# Producción (una vez)
npm run test:run

# Interfaz gráfica
npm run test:ui

# Cobertura
npm run test:coverage
```

### Logging (desde código)
```javascript
const logger = require('./electron/logger');

// Consultar logs
logger.getLogsByDate('2026-03-13');
logger.getRecentLogs(7);
logger.searchLogs({ type: 'ERROR' });

// Exportar logs
logger.exportLogs('./backup.json');
```

---

## 7. Buenas Prácticas Establecidas

### Logging
1. **No loggear datos sensibles:** Contraseñas, tokens, etc.
2. **Usar el tipo correcto:** INFO, SUCCESS, ERROR, etc.
3. **Incluir usuario:** Siempre que sea posible
4. **Contexto suficiente:** Module y acción descriptivos

### Testing
1. **Tests unitarios:** Para stores y utilidades
2. **Tests de componentes:** Para componentes Vue
3. **Tests E2E:** Para flujos críticos (pendiente)
4. **Cobertura mínima:** 80% recomendado

---

## 8. Próximos Pasos Sugeridos

1. **Agregar logging a más IPC handlers:**
   - Operaciones de grupos
   - Operaciones de alumnos
   - Operaciones de calificaciones
   - Operaciones de asistencia

2. **Expandir tests:**
   - Tests para el store `auth.ts`
   - Tests para el store `unsaved.ts`
   - Tests de componentes Vue
   - Tests de integración

3. **Dashboard de logs:**
   - Crear interfaz para consultar logs desde la app
   - Filtros por tipo, fecha, usuario
   - Exportar logs desde la UI

4. **Alertas de errores:**
   - Notificar errores críticos
   - Reporte automático de errores

---

## 9. Notas Importantes

1. **Logs en producción:** Los logs se guardan en `{userData}/log/`, no en la carpeta del proyecto
2. **Limpieza automática:** No es necesario eliminar logs manualmente
3. **Tests en CI/CD:** Usar `npm run test:run` para pipelines
4. **Seguridad:** Los logs no contienen información sensible

---

*Documento de contexto creado el 13 de Marzo, 2026 - Arkhe Systems*
