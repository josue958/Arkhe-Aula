class SyncProvider {
  constructor(config = {}) {
    this.config = config;
    this.isConnected = false;
  }

  /**
   * Autenticarse con el proveedor usando las credenciales en this.config
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async authenticate() {
    throw new Error('authenticate() no fue implementado en la clase derivada.');
  }

  /**
   * Sincronizar hacia arriba (push) datos locales a la nube
   * @param {string} localDbPath o datos codificados
   */
  async pushData(localData) {
    throw new Error('pushData() no fue implementado en la clase derivada.');
  }

  /**
   * Sincronizar hacia abajo (pull) datos de la nube
   * @returns {Promise<any>}
   */
  async pullData() {
    throw new Error('pullData() no fue implementado en la clase derivada.');
  }

  /**
   * Sincronizar un archivo binario o base de datos SQLite directamente
   */
  async syncFile(filePath, remoteName) {
    throw new Error('syncFile() no fue implementado.');
  }
}

module.exports = SyncProvider;
