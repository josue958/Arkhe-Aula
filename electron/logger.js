const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// ───────────────────────────────────────────────
// CONFIGURACIÓN DEL SISTEMA DE LOGGING
// ───────────────────────────────────────────────

let logDir = null;
let currentLogFile = null;
let logStream = null;

/**
 * Obtiene el directorio de logs
 */
function getLogDir() {
  if (!logDir) {
    logDir = path.join(app.getPath('userData'), 'log');
    // Crear directorio si no existe
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  return logDir;
}

/**
 * Obtiene el archivo de log del día actual
 */
function getTodayLogFile() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(getLogDir(), `transactions_${today}.log`);
}

/**
 * Inicializa el sistema de logging
 */
function initLogger() {
  const logFile = getTodayLogFile();
  
  // Si el archivo cambió (nuevo día), cerrar el stream anterior
  if (currentLogFile !== logFile && logStream) {
    logStream.end();
    logStream = null;
  }
  
  currentLogFile = logFile;
  
  // Crear stream de escritura (append mode)
  if (!logStream) {
    logStream = fs.createWriteStream(logFile, { flags: 'a', encoding: 'utf8' });
  }
  
  console.log('[Logger] Sistema de logging inicializado:', logFile);
}

/**
 * Escribe una entrada en el log
 * @param {string} type - Tipo de transacción (INFO, SUCCESS, ERROR, WARNING, DB, IPC, AUTH, etc.)
 * @param {string} module - Módulo donde ocurre la transacción
 * @param {string} action - Acción realizada
 * @param {any} [data] - Datos adicionales de la transacción
 * @param {string} [user] - Usuario que realizó la acción (opcional)
 */
function log(type, module, action, data = null, user = 'system') {
  if (!logStream) {
    initLogger();
  }
  
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    type,
    module,
    action,
    data,
    user,
  };
  
  const logLine = JSON.stringify(entry) + '\n';
  
  // Escribir en el archivo
  logStream.write(logLine);
  
  // También escribir en consola en modo desarrollo
  if (process.env.NODE_ENV === 'development') {
    const colorMap = {
      'INFO': '\x1b[36m',    // Cyan
      'SUCCESS': '\x1b[32m', // Green
      'ERROR': '\x1b[31m',   // Red
      'WARNING': '\x1b[33m', // Yellow
      'DB': '\x1b[35m',      // Magenta
      'IPC': '\x1b[34m',     // Blue
      'AUTH': '\x1b[37m',    // White
    };
    const color = colorMap[type] || '\x1b[0m';
    console.log(`${color}[${timestamp}] [${type}] [${module}] ${action}\x1b[0m`, data || '');
  }
}

// ───────────────────────────────────────────────
// MÉTODOS ESPECÍFICOS POR TIPO
// ───────────────────────────────────────────────

/**
 * Log de transacciones de base de datos
 */
function logDB(action, table, data = null, user = 'system') {
  log('DB', 'database', `${action}:${table}`, data, user);
}

/**
 * Log de llamadas IPC
 */
function logIPC(channel, data = null, user = 'system') {
  log('IPC', 'ipc-handlers', channel, data, user);
}

/**
 * Log de autenticación
 */
function logAuth(action, email = null, user = 'system') {
  // No loggear contraseñas por seguridad
  const safeData = email ? { email } : null;
  log('AUTH', 'auth', action, safeData, user);
}

/**
 * Log de información general
 */
function logInfo(module, action, data = null, user = 'system') {
  log('INFO', module, action, data, user);
}

/**
 * Log de éxito
 */
function logSuccess(module, action, data = null, user = 'system') {
  log('SUCCESS', module, action, data, user);
}

/**
 * Log de error
 */
function logError(module, action, error = null, user = 'system') {
  const errorData = error instanceof Error 
    ? { message: error.message, stack: error.stack }
    : error;
  log('ERROR', module, action, errorData, user);
}

/**
 * Log de advertencia
 */
function logWarning(module, action, data = null, user = 'system') {
  log('WARNING', module, action, data, user);
}

// ───────────────────────────────────────────────
// UTILIDADES
// ───────────────────────────────────────────────

/**
 * Obtiene todos los logs de un archivo específico
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Array} Array de entradas de log
 */
function getLogsByDate(date) {
  const logFile = path.join(getLogDir(), `transactions_${date}.log`);
  
  if (!fs.existsSync(logFile)) {
    return [];
  }
  
  const content = fs.readFileSync(logFile, 'utf8');
  return content
    .trim()
    .split('\n')
    .filter(line => line)
    .map(line => JSON.parse(line));
}

/**
 * Obtiene los logs de los últimos N días
 * @param {number} days - Número de días
 * @returns {Array} Array de entradas de log
 */
function getRecentLogs(days = 7) {
  const logs = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    logs.push(...getLogsByDate(dateStr));
  }
  
  // Ordenar por timestamp
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Busca logs por criterio
 * @param {Object} criteria - Criterios de búsqueda
 * @returns {Array} Array de entradas de log filtradas
 */
function searchLogs(criteria) {
  const { type, module, action, user, startDate, endDate } = criteria;
  const logs = getRecentLogs(30); // Últimos 30 días
  
  return logs.filter(log => {
    if (type && log.type !== type) return false;
    if (module && log.module !== module) return false;
    if (action && !log.action.includes(action)) return false;
    if (user && log.user !== user) return false;
    if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
    if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;
    return true;
  });
}

/**
 * Limpia logs antiguos
 * @param {number} daysToKeep - Días de logs a conservar
 */
function cleanupOldLogs(daysToKeep = 30) {
  const logDirectory = getLogDir();
  const files = fs.readdirSync(logDirectory);
  const today = new Date();
  
  files.forEach(file => {
    if (!file.startsWith('transactions_') || !file.endsWith('.log')) {
      return;
    }
    
    // Extraer fecha del nombre del archivo
    const dateStr = file.replace('transactions_', '').replace('.log', '');
    const fileDate = new Date(dateStr);
    const diffTime = Math.abs(today - fileDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > daysToKeep) {
      fs.unlinkSync(path.join(logDirectory, file));
      console.log(`[Logger] Log eliminado: ${file}`);
    }
  });
}

/**
 * Exporta logs a un archivo
 * @param {string} destPath - Ruta de destino
 * @param {Array} logs - Logs a exportar (opcional, por defecto todos los recientes)
 */
function exportLogs(destPath, logs = null) {
  if (!logs) {
    logs = getRecentLogs(30);
  }
  
  const content = logs.map(log => JSON.stringify(log)).join('\n');
  fs.writeFileSync(destPath, content, 'utf8');
  console.log(`[Logger] Logs exportados a: ${destPath}`);
}

// ───────────────────────────────────────────────
// INICIALIZACIÓN
// ───────────────────────────────────────────────

// Inicializar cuando la app está lista
app.whenReady().then(() => {
  initLogger();
  
  // Limpieza automática de logs antiguos (cada 24 horas)
  setInterval(() => {
    cleanupOldLogs(30);
    initLogger(); // Re-inicializar para el nuevo día
  }, 24 * 60 * 60 * 1000);
});

// ───────────────────────────────────────────────
// EXPORTAR
// ───────────────────────────────────────────────

module.exports = {
  // Método general
  log,
  
  // Métodos específicos
  logDB,
  logIPC,
  logAuth,
  logInfo,
  logSuccess,
  logError,
  logWarning,
  
  // Utilidades
  getLogsByDate,
  getRecentLogs,
  searchLogs,
  cleanupOldLogs,
  exportLogs,
  
  // Inicialización manual (si se necesita)
  initLogger,
};
