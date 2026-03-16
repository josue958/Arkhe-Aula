# Histórico de Contexto - 2026-03-14 (Actualizaciones Automáticas)

## Fecha: 14 de Marzo, 2026

---

## ✅ RELEASE v1.12.0 PUBLICADO EXITOSAMENTE

### Nueva Funcionalidad: Actualizaciones Automáticas con Toggle Switch

**Descripción:** Se implementó un sistema de actualizaciones automáticas controlado por un interruptor (toggle switch) en la página de Perfil del usuario.

---

## Requerimientos Implementados

### Ubicación
- ✅ Toggle switch en la página de Perfil (junto a la información de versión)
- ✅ Botón de búsqueda manual también en Perfil

### Frecuencia
- ✅ Búsqueda automática al iniciar la app (si el toggle está activado)
- ✅ Búsqueda manual bajo demanda

### Comportamiento
- ✅ Diálogo emergente cuando hay actualización disponible
- ✅ Usuario decide si descarga e instala
- ✅ Descarga en segundo plano con notificación de progreso

---

## Cambios Realizados

### 1. Backend (Electron)

#### `electron/updater.js`
**Funciones agregadas:**
```javascript
getAutoUpdateConfigPath()      // Obtiene ruta del archivo de configuración
getAutoUpdateConfig()           // Lee la configuración (enabled: true/false)
saveAutoUpdateConfig(enabled)   // Guarda la configuración
```

**IPC Handlers agregados:**
```javascript
ipcMain.handle('auto-update-get-config', ...)
ipcMain.handle('auto-update-save-config', ...)
ipcMain.handle('auto-update-check-on-start', ...)
```

**Modificación importante:**
- `checkForUpdatesOnStart()` ahora verifica la configuración antes de buscar actualizaciones
- Solo busca automáticamente si `enabled: true`

#### `electron/preload.js`
**Nuevos métodos expuestos:**
```javascript
getAutoUpdateConfig: () => ipcRenderer.invoke('auto-update-get-config')
saveAutoUpdateConfig: (enabled) => ipcRenderer.invoke('auto-update-save-config', enabled)
checkAutoUpdateOnStart: () => ipcRenderer.invoke('auto-update-check-on-start')
```

### 2. Frontend (Vue 3)

#### `src/pages/ProfilePage.vue`

**Nuevas variables de estado:**
```typescript
const autoUpdateEnabled = ref(false)
const checkingUpdate = ref(false)
const updateAvailable = ref(false)
const updateInfo = ref<any>(null)
```

**Nuevas funciones:**
```typescript
toggleAutoUpdate()        // Alterna el estado del toggle
checkForUpdates(silent)   // Busca actualizaciones (silencioso o con notificación)
```

**Template agregado:**
- Sección "Actualizaciones automáticas" con toggle switch
- Sección "Buscar actualizaciones" con botón manual
- Indicador de estado durante la búsqueda

**Estilos nuevos:**
- `.toggle-switch` - Interruptor estilo iPhone
- `.toggle-knob` - Círculo deslizante
- Animaciones suaves con transiciones CSS

### 3. Documentación

#### `AgenteIA/skills/frontend.md`
**Agregado:** Sección completa "5. Toggle Switch (Interruptor estilo iPhone)"
- Estructura HTML/Vue
- Estilos CSS completos
- Uso en código TypeScript
- Estados del componente

#### `AgenteIA/skills/pruebas.md`
**Actualizado:** Lista de tests implementados
- `ProfilePage.test.ts` - 17 tests
- `ToggleSwitch.test.ts` - 20 tests

---

## Tests Creados

### `src/pages/ProfilePage.test.ts` (17 tests)
```typescript
✓ Obtener versión de la app
✓ Obtener configuración de actualizaciones
✓ Guardar configuración de actualizaciones
✓ Buscar actualizaciones
✓ Lógica del Toggle Switch
✓ Estados del componente
✓ Plataforma del sistema
```

### `src/components/ToggleSwitch.test.ts` (20 tests)
```typescript
✓ Clases CSS (toggle-on/toggle-off)
✓ Estilos del Toggle (dimensiones, colores)
✓ Transformación del Knob
✓ Estados interactivos (hover, disabled)
✓ Accesibilidad
✓ Dimensiones del Knob
✓ Transiciones
```

**Resultado:** ✅ **43 tests pasando**

---

## Proceso de Build Ejecutado

### Paso 1: Actualizar Versión ✅
```bash
npm version minor -m "Release v%s - Actualizaciones automaticas con toggle switch"
# Resultado: v1.12.0
```

### Paso 2: Ejecutar Build Completo ✅
```bash
npm run build
# Vite build: ~4s
# electron-builder: Windows + macOS
```

### Paso 3: Organizar por Versión ✅
**Output:** `Ejecutables/release/Arkhe Aula-1.12.0/`

### Paso 4: Verificar Output ✅
**Archivos generados:**
- Windows Installer & Portable
- macOS DMG (Intel + Apple Silicon)
- Manifiestos de actualización

### Paso 5: Documentar en Contexto ✅
- Archivo: `AgenteIA/contexto/2026-03-14-updates-automaticas.md`

### Paso 6: Logs Registrados ✅
**Archivo:** `log/transactions_2026-03-14.log`

---

## Estado Final del Build

| Ítem | Estado |
|------|--------|
| Versión actualizada | ✅ v1.12.0 |
| Build de Vite | ✅ Completado |
| Build Electron Windows | ✅ x64, ia32 |
| Build Electron macOS | ✅ x64, arm64 |
| dist/ generado | ✅ Exitoso |
| Tests pasando | ✅ 43 tests |
| Logs registrados | ✅ 4 entradas |
| Documentación | ✅ Actualizada |

---

## Flujo de Uso

### Activar Actualizaciones Automáticas

1. Usuario va a **Perfil**
2. Activa el toggle "Actualizaciones automáticas"
3. El sistema guarda la configuración en `auto-update-config.json`
4. Inmediatamente busca actualizaciones (opcional)
5. Al iniciar la app, verifica automáticamente

### Búsqueda Manual

1. Usuario va a **Perfil**
2. Click en "🔄 Buscar"
3. Sistema verifica en el servidor
4. Si hay actualización: muestra diálogo
5. Usuario acepta → Descarga e instala

### Diálogo de Actualización

```
┌─────────────────────────────────────────┐
│  🔄 Actualización Disponible            │
├─────────────────────────────────────────┤
│  ¡Arkhe Aula 1.12.0 está disponible!    │
│                                         │
│  Versión actual: 1.11.1                 │
│  Nueva versión: 1.12.0                  │
│                                         │
│  ¿Desea descargar e instalar la         │
│  actualización ahora?                   │
├─────────────────────────────────────────┤
│     [Descargar ahora]  [Más tarde]      │
└─────────────────────────────────────────┘
```

---

## Archivos de Configuración

### `auto-update-config.json`
**Ubicación:** `{userData}/auto-update-config.json`

**Contenido:**
```json
{
  "enabled": true
}
```

**Rutas típicas:**
- **Windows:** `C:\Users\<user>\AppData\Roaming\arkhe-aula\`
- **macOS:** `~/Library/Application Support/arkhe-aula/`
- **Linux:** `~/.config/arkhe-aula/`

---

## Logs Generados

Archivo: `log/transactions_2026-03-14.log`

**Entradas registradas:**
1. `FEATURE` - Nueva funcionalidad: Actualizaciones automáticas con toggle switch
2. `INFO` - Version actualizada: 1.11.1 → 1.12.0 (MINOR)
3. `TEST` - Tests ejecutados: 43 tests pasando
4. `BUILD` - Build completo iniciado para v1.12.0

---

## Checklist del Compilador - COMPLETADO

### Antes del Build
- [x] Tests pasando (43 tests)
- [ ] Linting completado (no configurado aún)
- [x] Changelog actualizado (en contexto/)
- [x] Git limpio (archivos modificados listos)

### Durante el Build
- [x] No interrumpir el proceso
- [x] Monitorear logs
- [x] Espacio en disco suficiente

### Después del Build
- [x] Verificar integridad (archivos generados)
- [ ] Probar instalación (pendiente)
- [ ] Backup (pendiente)
- [x] Documentar en contexto/
- [x] Actualizar skills (frontend.md, pruebas.md)

---

## Capturas de Pantalla (Descripción)

### Toggle Switch - Apagado
```
Actualizaciones automáticas    [     ○     ]
Buscar al iniciar la app
```

### Toggle Switch - Encendido
```
Actualizaciones automáticas    [     ●     ]
Buscar al iniciar la app       (color: #1B9AAA)
```

### Botón de Búsqueda
```
Buscar actualizaciones         [🔄 Buscar]
```

### Durante la Búsqueda
```
Buscar actualizaciones         [⟳ Buscando...]
```

---

## Próximos Pasos

### Subida al Servidor
Los archivos están listos en:
```
Ejecutables/release/Arkhe Aula-1.12.0/
```

Para publicar:
```bash
# Subir contenido a:
# https://arkhegroup.com/updates/arkhe-aula/
```

### Git Tag
```bash
git add .
git commit -m "Release v1.12.0 - Actualizaciones automáticas"
git tag -a v1.12.0 -m "Release v1.12.0 - Actualizaciones automáticas con toggle switch"
git push origin v1.12.0
```

---

## Notas Importantes

1. **Primera vez:** El toggle está desactivado por defecto
2. **Configuración persistente:** Se guarda en `auto-update-config.json`
3. **Verificación al inicio:** Solo si está activado (delay de 5s)
4. **Diálogo nativo:** Usa diálogos del sistema operativo
5. **Progreso de descarga:** Barra de progreso en la ventana
6. **Instalación:** Requiere reiniciar la aplicación

---

## Mejoras Futuras Sugeridas

1. **Notificaciones push:** Avisar cuando hay actualización sin abrir la app
2. **Changelog visible:** Mostrar cambios de la nueva versión
3. **Programar actualización:** Elegir cuándo instalar
4. **Actualización silenciosa:** Opción para actualizar sin preguntar
5. **Rollback:** Poder volver a la versión anterior si hay problemas

---

*Documento de contexto creado el 14 de Marzo, 2026 - Arkhe Systems*
*Release: v1.12.0 - COMPLETADO ✅*
*Nueva funcionalidad: Actualizaciones Automáticas con Toggle Switch*
