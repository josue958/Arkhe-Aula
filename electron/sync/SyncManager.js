const FirebaseProvider = require('./providers/FirebaseProvider');
const CloudKitProvider = require('./providers/CloudKitProvider');
const MicrosoftGraphProvider = require('./providers/MicrosoftGraphProvider');

class SyncManager {
  constructor() {
    this.provider = null;
    this.providerName = 'none';
  }

  /**
   * Patrón Strategy: Cambia el proveedor de sincronización en tiempo de ejecución
   * @param {'firebase'|'cloudkit'|'microsoft'|'none'} providerType 
   * @param {Object} config API Keys y Autenticación
   */
  setProvider(providerType, config = {}) {
    this.providerName = providerType;
    switch (providerType) {
      case 'firebase':
        this.provider = new FirebaseProvider(config);
        break;
      case 'cloudkit':
        this.provider = new CloudKitProvider(config);
        break;
      case 'microsoft':
        this.provider = new MicrosoftGraphProvider(config);
        break;
      case 'none':
      default:
        this.provider = null;
    }
    console.log(`[SyncManager] Proveedor activo cambiado a: ${providerType}`);
  }

  async connect() {
    if (!this.provider) throw new Error('No se ha seleccionado proveedor (Strategy) de sincronización.');
    return await this.provider.authenticate();
  }

  async pushLocalChanges(localData) {
    if (!this.provider) throw new Error('Ningún proveedor configurado.');
    return await this.provider.pushData(localData);
  }

  async pullRemoteChanges() {
    if (!this.provider) throw new Error('Ningún proveedor configurado.');
    return await this.provider.pullData();
  }

  async backupDatabase(localDbPath, remoteFilename) {
    if (!this.provider) throw new Error('Ningún proveedor configurado.');
    return await this.provider.syncFile(localDbPath, remoteFilename);
  }

  getStatus() {
    if (!this.provider) return { active: false, provider: 'none' };
    return { active: this.provider.isConnected, provider: this.providerName };
  }
}

const syncManagerInstance = new SyncManager();
module.exports = syncManagerInstance;
