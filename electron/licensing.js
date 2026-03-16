const { ipcMain, app } = require('electron');
const { machineIdSync } = require('node-machine-id');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

// Configuración
const LICENSE_SERVER_URL = 'http://localhost:3000'; // Cambiar por tu URL de producción
const LICENSE_FILE = path.join(app.getPath('userData'), 'license.dat');
const SECRET_KEY = 'ARKHE_AULA_SECRET_2026'; // Clave para cifrado local (AES)

// ── Generar Fingerprint (Machine ID) ──────────────────────────────────────
function getMachineFingerprint() {
    try {
        const id = machineIdSync();
        // Combinar con nombre de equipo para mayor robustez
        const hostname = require('os').hostname();
        return crypto.createHash('sha256').update(id + hostname).digest('hex');
    } catch (e) {
        console.error('Error generando fingerprint:', e);
        return 'UNKNOWN_DEVICE';
    }
}

// ── Encriptación Local (AES-256-CBC) ─────────────────────────────────────
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(SECRET_KEY, 'salt', 32), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(SECRET_KEY, 'salt', 32), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// ── Handlers IPC ────────────────────────────────────────────────────────
function initLicensing() {
    
    // Obtener fingerprint
    ipcMain.handle('license-get-fingerprint', () => {
        return getMachineFingerprint();
    });

    // Activar licencia (Servidor)
    ipcMain.handle('license-activate-server', async (event, { email, clave }) => {
        const device_id = getMachineFingerprint();
        
        try {
            const response = await axios.post(`${LICENSE_SERVER_URL}/api/activate`, {
                email,
                clave,
                device_id,
                version: app.getVersion()
            });

            if (response.data.success) {
                // Guardar localmente de forma cifrada
                const licenseData = JSON.stringify({
                    clave,
                    email,
                    expira: response.data.data.expira,
                    activatedAt: new Date().toISOString()
                });

                fs.writeFileSync(LICENSE_FILE, encrypt(licenseData), 'utf8');
                return { success: true, message: '¡Software activado correctamente!' };
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Error de conexión con el servidor';
            return { success: false, message: msg };
        }
    });

    // Verificar licencia (Servidor - Local + Remoto opcional)
    ipcMain.handle('license-verify-server', async () => {
        if (!fs.existsSync(LICENSE_FILE)) {
            return { success: false, message: 'Sin licencia activada' };
        }

        try {
            const encryptedData = fs.readFileSync(LICENSE_FILE, 'utf8');
            const decryptedData = decrypt(encryptedData);
            const license = JSON.parse(decryptedData);

            // Verificar expiración local
            if (new Date(license.expira) < new Date()) {
                return { success: false, message: 'Licencia expirada', isExpired: true };
            }

            return { success: true, data: license };
        } catch (e) {
            return { success: false, message: 'Error de integridad' };
        }
    });
}

module.exports = { initLicensing };
