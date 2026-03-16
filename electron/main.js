const { app, BrowserWindow, Menu, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { initUpdater, checkForUpdatesOnStart } = require('./updater');
const { initLicensing } = require('./licensing');
const logger = require('./logger');
const axios = require('axios');

let mainWindow;
const isDev = process.env.NODE_ENV === 'development';

// ───────────────────────────────────────────────
// Prevenir múltiples instancias
// ───────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

// Ignorar errores de certificado para el dominio de actualizaciones
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('https://arkhegroup.com/') || url.startsWith('https://www.arkhegroup.com/')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Forzar configuración global a es-MX para mostrar formato de 12 horas (AM/PM) en controles del navegador (ej: datetime-local)
app.commandLine.appendSwitch('lang', 'es-MX');

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let isQuitting = false;
app.on('before-quit', () => {
  isQuitting = true;
});


// ───────────────────────────────────────────────
// Registrar todos los handlers IPC
// ───────────────────────────────────────────────
require('./ipc-handlers');

// ───────────────────────────────────────────────
// Crear ventana principal
// ───────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      spellcheck: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#0f172a',
    show: false,
    icon: isDev
      ? path.join(__dirname, '..', 'build', 'icon.png')
      : path.join(__dirname, '..', 'build', 'icon.png'),
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    // Inicializar sistema de actualizaciones
    initUpdater(mainWindow);
    checkForUpdatesOnStart();
    initLicensing();
  });

  // En desarrollo usa Vite dev server; en producción, los archivos compilados
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('context-menu', (event, params) => {
    const menuTemplate = [];
    
    // Sugerencias ortográficas
    if (params.dictionarySuggestions && params.dictionarySuggestions.length > 0) {
      params.dictionarySuggestions.forEach(suggestion => {
        menuTemplate.push({
          label: suggestion,
          click: () => mainWindow.webContents.replaceMisspelling(suggestion)
        });
      });
      menuTemplate.push({ type: 'separator' });
    }
    
    if (params.misspelledWord) {
      menuTemplate.push({
        label: 'Añadir al diccionario',
        click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
      });
      menuTemplate.push({ type: 'separator' });
    }

    // Opciones básicas de edición
    if (params.isEditable) {
      menuTemplate.push({ role: 'cut', label: 'Cortar' });
      menuTemplate.push({ role: 'copy', label: 'Copiar' });
      menuTemplate.push({ role: 'paste', label: 'Pegar' });
    } else if (params.selectionText.length > 0) {
      menuTemplate.push({ role: 'copy', label: 'Copiar' });
    }

    if (menuTemplate.length > 0) {
      Menu.buildFromTemplate(menuTemplate).popup();
    }
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.webContents.send('app-closing');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

// ───────────────────────────────────────────────
// Menú de la aplicación
// ───────────────────────────────────────────────
function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [{
          label: 'Arke Software',
          submenu: [
            { role: 'about', label: 'Acerca de Arke Software' },
            { type: 'separator' },
            { role: 'services', label: 'Servicios' },
            { type: 'separator' },
            { role: 'hide', label: 'Ocultar Arke Software' },
            { role: 'hideOthers', label: 'Ocultar Otros' },
            { role: 'unhide', label: 'Mostrar Todo' },
            { type: 'separator' },
            { role: 'quit', label: 'Salir' },
          ],
        }]
      : []),
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nuevo Grupo',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => mainWindow?.webContents.send('menu-new-group'),
        },
        { type: 'separator' },
        {
          label: 'Exportar Base de Datos',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              title: 'Exportar Base de Datos',
              defaultPath: `arke-backup-${Date.now()}.db`,
              filters: [{ name: 'Base de Datos SQLite', extensions: ['db'] }],
            });
            if (!result.canceled && result.filePath) {
              mainWindow?.webContents.send('export-database', result.filePath);
            }
          },
        },
        {
          label: 'Importar Base de Datos',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              title: 'Importar Base de Datos',
              filters: [{ name: 'Base de Datos SQLite', extensions: ['db'] }],
              properties: ['openFile'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('import-database', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        isMac
          ? { role: 'close', label: 'Cerrar' }
          : { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar Todo' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' },
      ],
    },
    {
      label: 'Acciones',
      submenu: [
        {
          label: 'Tomar Asistencia',
          accelerator: 'CmdOrCtrl+A',
          click: () => mainWindow?.webContents.send('menu-attendance'),
        },
        {
          label: 'Calificaciones',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow?.webContents.send('menu-grades'),
        },
      ],
    },
    {
      label: 'Ventana',
      role: isMac ? 'windowMenu' : 'window',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'zoom', label: 'Zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front', label: 'Traer al Frente' }] : []),
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de Arke Software',
          click: () => mainWindow?.webContents.send('show-about'),
        },
        { type: 'separator' },
        {
          label: 'Buscar actualizaciones...',
          click: async () => {
            const { autoUpdater } = require('electron-updater');
            try {
              const result = await autoUpdater.checkForUpdates();
              if (!result || !result.updateInfo) {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Sin actualizaciones',
                  message: 'Arkhe Aula está al día.',
                  detail: `Versión instalada: ${app.getVersion()}`,
                  buttons: ['Aceptar'],
                });
              }
            } catch (err) {
              dialog.showErrorBox(
                'Error al buscar actualizaciones',
                'No se pudo conectar al servidor de actualizaciones.\n\n' + err.message
              );
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ───────────────────────────────────────────────
// Handlers IPC básicos del proceso principal
// ───────────────────────────────────────────────
// Redundante: ya se registra en updater.js
// ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('get-user-data-path', () => app.getPath('userData'));
ipcMain.handle('get-local-ip', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
});

ipcMain.handle('dialog-open-file', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('dialog-save-file', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('copy-file', async (_, { src, dest }) => {
  fs.copyFileSync(src, dest);
  return true;
});

ipcMain.handle('read-file', async (_, filePath) => {
  return fs.readFileSync(filePath);
});

ipcMain.handle('force-quit', () => {
  isQuitting = true;
  app.quit();
});



// ───────────────────────────────────────────────
// Ciclo de vida de la app
// ───────────────────────────────────────────────
app.whenReady().then(() => {
  // Inicializar logger
  logger.initLogger();
  logger.logInfo('main', 'Aplicación iniciada');
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
