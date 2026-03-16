/**
 * updater.js — Módulo de Actualización Automática
 * Arkhe Aula — Arkhe Group © 2026
 *
 * Usa electron-updater para detectar y aplicar actualizaciones.
 * - Windows: el instalador NSIS detecta si ya está instalado y muestra "Actualizar"
 * - macOS: descarga el .zip en segundo plano y reemplaza la app al reiniciar
 */

const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow, ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');

// ── Configuración ──────────────────────────────────────────────────────────
autoUpdater.autoDownload = true;           // Descargar automáticamente para GitHub Releases
autoUpdater.autoInstallOnAppQuit = true;   // Al cerrar la app instala si ya descargó
autoUpdater.allowPrerelease = false;
autoUpdater.allowDowngrade = false;
autoUpdater.forceDevUpdateConfig = false;  // Usar configuración de package.json

// Logs detallados (útil en desarrollo)
autoUpdater.logger = {
  info: (msg) => console.log('[Updater-INFO]', msg),
  warn: (msg) => console.warn('[Updater-WARN]', msg),
  error: (msg) => console.error('[Updater-ERROR]', msg),
  verbose: (msg) => console.log('[Updater-VERBOSE]', msg),
  debug: (msg) => console.log('[Updater-DEBUG]', msg),
  silly: (msg) => console.log('[Updater-SILLY]', msg)
};

// ── Estado interno ─────────────────────────────────────────────────────────
let updateAvailable = false;
let updateDownloaded = false;
let updateInfo = null;
let mainWindowRef = null;

// ── Configuración de actualizaciones automáticas ──────────────────────────
// ── Configuración de actualizaciones automáticas ──────────────────────────

function getAutoUpdateConfigPath() {
  return path.join(app.getPath('userData'), 'auto-update-config.json');
}

function getAutoUpdateConfig() {
  try {
    const configPath = getAutoUpdateConfigPath();
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return data;
    }
  } catch (e) {
    console.error('[Updater] Error al leer configuración:', e);
  }
  return { enabled: false }; // Por defecto desactivado
}

function saveAutoUpdateConfig(enabled) {
  try {
    const configPath = getAutoUpdateConfigPath();
    fs.writeFileSync(configPath, JSON.stringify({ enabled }), 'utf8');
    return true;
  } catch (e) {
    console.error('[Updater] Error al guardar configuración:', e);
    return false;
  }
}

// ── Inicializar ────────────────────────────────────────────────────────────
function initUpdater(mainWindow) {
  mainWindowRef = mainWindow;

  // ── Listeners de autoUpdater ─────────────────────────────────────────────

  autoUpdater.on('checking-for-update', () => {
    sendStatus('checking');
  });

  autoUpdater.on('update-available', (info) => {
    updateAvailable = true;
    updateInfo = info;
    sendStatus('available', info);

    // Mostrar diálogo de confirmación
    showUpdateAvailableDialog(info);
  });

  autoUpdater.on('update-not-available', (info) => {
    updateAvailable = false;
    sendStatus('not-available', info);
  });

  autoUpdater.on('error', (err) => {
    sendStatus('error', { message: err.message });
    console.error('[Updater] Error:', err);
  });

  autoUpdater.on('download-progress', (progress) => {
    sendStatus('downloading', progress);
    // Actualizar barra de progreso de la ventana (Windows/macOS)
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.setProgressBar(progress.percent / 100);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateDownloaded = true;
    sendStatus('downloaded', info);
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.setProgressBar(-1); // Quitar barra de progreso
    }
    showUpdateReadyDialog(info);
  });

  // ── IPC Handlers ──────────────────────────────────────────────────────────

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('updater-check', async () => {
    try {
      console.log('[Updater] Verificando actualizaciones manualmente...');
      const result = await autoUpdater.checkForUpdates();
      console.log('[Updater] Resultado:', result);
      // Verificamos si updateInfo está presente y si la versión nueva es distinta a la actual instalada
      const updateFound = !!(result && result.updateInfo && result.updateInfo.version !== app.getVersion());
      console.log('[Updater] Update found:', updateFound, 'Current version:', app.getVersion(), 'Remote version:', result?.updateInfo?.version);
      return { success: true, updateFound, version: result?.updateInfo?.version };
    } catch (err) {
      console.error('[Updater] Error al verificar:', err.message);
      return { success: false, message: err.message, stack: err.stack };
    }
  });

  ipcMain.handle('updater-download', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('updater-install', () => {
    if (updateDownloaded) {
      autoUpdater.quitAndInstall(false, true);
    }
    return { success: updateDownloaded };
  });

  ipcMain.handle('updater-status', () => ({
    updateAvailable,
    updateDownloaded,
    updateInfo,
  }));

  // ── Handlers para actualizaciones automáticas ────────────────────────────

  ipcMain.handle('auto-update-get-config', () => {
    return getAutoUpdateConfig();
  });

  ipcMain.handle('auto-update-save-config', (_, enabled) => {
    const success = saveAutoUpdateConfig(enabled);
    return { success };
  });

  // Verificar actualizaciones al inicio solo si está activado
  ipcMain.handle('auto-update-check-on-start', async () => {
    const config = getAutoUpdateConfig();
    if (config.enabled) {
      try {
        await autoUpdater.checkForUpdates();
        return { success: true, checked: true };
      } catch (err) {
        console.error('[Updater] Error en verificación automática:', err);
        return { success: false, checked: true, error: err.message };
      }
    }
    return { success: true, checked: false };
  });
}

// ── Diálogos ───────────────────────────────────────────────────────────────

function showUpdateAvailableDialog(info) {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) return;

  const currentVersion = require('electron').app.getVersion();
  const newVersion = info.version;

  dialog.showMessageBox(mainWindowRef, {
    type: 'info',
    title: 'Actualización Disponible',
    message: `¡Arkhe Aula ${newVersion} está disponible!`,
    detail: `Versión actual: ${currentVersion}\nNueva versión: ${newVersion}\n\nLa actualización se descargará automáticamente. Una vez completada, podrás reiniciar para instalar.`,
    buttons: ['Descargar ahora', 'Más tarde'],
    defaultId: 0,
    cancelId: 1,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
  }).then(({ response }) => {
    if (response === 0) {
      autoUpdater.downloadUpdate();
      // Notificar a la UI que inició la descarga
      sendStatus('downloading-started');
    }
  });
}

function showUpdateReadyDialog(info) {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) return;

  dialog.showMessageBox(mainWindowRef, {
    type: 'question',
    title: 'Actualización Lista para Instalar',
    message: `Arkhe Aula ${info.version} está lista para instalar.`,
    detail: 'Se realizará un respaldo automático de tu base de datos antes de actualizar.\n\n¿Deseas reiniciar ahora para completar la instalación?',
    buttons: ['Reiniciar e instalar', 'Después'],
    defaultId: 0,
    cancelId: 1,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
  }).then(({ response }) => {
    if (response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });
}

// ── Verificar al inicio (con delay para no bloquear el arranque) ───────────
function checkForUpdatesOnStart() {
  // Verificar configuración de actualizaciones automáticas
  const config = getAutoUpdateConfig();

  // Solo verificar si está activado y no en desarrollo
  if (!config.enabled || process.env.NODE_ENV === 'development') {
    console.log('[Updater] Actualizaciones automáticas:', config.enabled ? 'Activadas' : 'Desactivadas');
    if (process.env.NODE_ENV === 'development') {
      console.log('[Updater] Desarrollo detectado - actualizaciones automáticas desactivadas');
    }
    return;
  }

  setTimeout(async () => {
    try {
      console.log('[Updater] Verificando actualizaciones desde GitHub Releases...');
      const result = await autoUpdater.checkForUpdates();
      if (result && result.updateInfo) {
        console.log('[Updater] Última versión en GitHub:', result.updateInfo.version);
      }
    } catch (err) {
      console.error('[Updater] Error al verificar GitHub Releases:', err.message);
      // No mostrar error al usuario si es problema de red temporal
      if (err.code !== 'ENOTFOUND' && !err.message.includes('net::')) {
        console.error('[Updater] Error detallado:', err);
      }
    }
  }, 3000); // 3 segundos de delay
}

// ── Enviar estado al renderer ──────────────────────────────────────────────
function sendStatus(event, data = {}) {
  try {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('updater-event', { event, data });
      }
    });
  } catch (e) {
    // Ignorar errores si la ventana fue cerrada
  }
}

module.exports = { initUpdater, checkForUpdatesOnStart };
