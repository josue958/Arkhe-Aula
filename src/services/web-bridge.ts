/**
 * Bridge para habilitar las llamadas a electronAPI desde un navegador (iPad/Tablet)
 * Se conecta a la computadora principal vía WebSocket.
 */

export async function initWebBridge() {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return; // Ya estamos en Electron
  }

  console.log('[WebBridge] No se detectó electronAPI. Iniciando bridge por WebSocket...');

  // Intentar conectar al servidor WS en el mismo host que sirve los archivos (Vite)
  // Vite corre en el puerto 5173, nuestro bridge en el 3001
  const host = window.location.hostname;
  const wsUrl = `ws://${host}:3001`;

  const socket = new WebSocket(wsUrl);
  const pendingRequests = new Map<string, { resolve: Function, reject: Function }>();

  const bridgeAPI : any = {};

  // Mock de todos los métodos conocidos (basado en preload.js)
  // Podemos definirlos dinámicamente o listar los más importantes
  const methods = [
    'login', 'logout', 'getCurrentUser', 'getUsers', 'createUser', 'updateUser', 'deleteUser',
    'getSchool', 'saveSchool', 'getCycles', 'getGroups', 'getStudents', 'getEvaluationData',
    'getAttendanceGroups', 'getAttendanceForDate', 'saveAttendance', 'getAttendanceReport',
    'getCloudSyncConfig', 'syncDatabase', 'getSettingsSubjectsForGroup', 'getTrimesters',
    'getDatabaseInfo', 'getLocalIp'
  ];

  methods.forEach(method => {
    bridgeAPI[method] = (...args: any[]) => {
      return new Promise((resolve, reject) => {
        if (socket.readyState !== WebSocket.OPEN) {
          return reject(new Error('La conexión con la computadora principal no está lista. Por favor, recarga la página.'));
        }

        const id = Math.random().toString(36).substring(2);
        pendingRequests.set(id, { resolve, reject });
        
        let channel = method;
        // Mapeo manual de alias de preload.js a canales reales
        const mapping: any = {
          'login': 'auth-login',
          'logout': 'auth-logout',
          'getCurrentUser': 'auth-current-user',
          'getUsers': 'auth-get-users',
          'createUser': 'auth-create-user',
          'updateUser': 'auth-update-user',
          'getSchool': 'school-get',
          'getGroups': 'groups-get-all',
          'getStudents': 'students-get-all',
          'getEvaluationData': 'evaluation-get-data',
          'getAttendanceGroups': 'attendance-get-groups',
          'getAttendanceReport': 'attendance-report',
          'getCloudSyncConfig': 'cloud-get-config',
          'getSettingsSubjectsForGroup': 'settings-get-subjects-for-group',
          'getTrimesters': 'settings-get-trimesters',
          'getDatabaseInfo': 'db-info',
          'syncDatabase': 'cloud-sync',
          'getLocalIp': 'get-local-ip'
        };

        if (mapping[method]) channel = mapping[method];

        try {
          socket.send(JSON.stringify({ id, channel, args }));
        } catch (e) {
          reject(e);
        }
      });
    };
  });

  socket.onmessage = (event) => {
    try {
      const { id, success, data, error } = JSON.parse(event.data);
      const pending = pendingRequests.get(id);
      if (pending) {
        if (success) pending.resolve(data);
        else pending.reject(new Error(error || 'Error desconocido en el servidor'));
        pendingRequests.delete(id);
      }
    } catch (e) {
      console.error('[WebBridge] Error procesando respuesta:', e);
    }
  };

  socket.onopen = () => {
    console.log('[WebBridge] Conectado a la computadora principal.');
    bridgeAPI.onMenuEvent = (cb: any) => { console.log('onMenuEvent no disponible en web'); };
    bridgeAPI.removeAllListeners = (ev: string) => {};
    (window as any).electronAPI = bridgeAPI;
    
    // Sincronización automática
    if (bridgeAPI.syncDatabase) {
      bridgeAPI.syncDatabase().catch((err: any) => console.log('Sync inicial silenciado:', err));
    }
  };

  socket.onclose = () => {
    console.warn('[WebBridge] Conexión cerrada. Intentando reconectar...');
    window.electronAPI = undefined as any;
    setTimeout(initWebBridge, 3000);
  };

  socket.onerror = (err) => {
    console.error('[WebBridge] Error de WebSocket:', err);
  };
}
