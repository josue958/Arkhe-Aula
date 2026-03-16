require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'arkhe_licencias'
};

let pool;

async function getPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

// Endpoint: /activate
app.post('/api/activate', async (req, res) => {
    const { email, clave, device_id, version } = req.body;

    if (!email || !clave || !device_id) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    try {
        const db = await getPool();
        const [rows] = await db.execute(
            'SELECT * FROM licencias WHERE clave = ? AND (email = ? OR email IS NULL)', 
            [clave, email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Licencia no válida' });
        }

        const licencia = rows[0];

        if (licencia.estado === 'revocada') {
            return res.status(403).json({ success: false, message: 'Licencia revocada' });
        }

        if (new Date(licencia.fecha_expiracion) < new Date()) {
            return res.status(403).json({ success: false, message: 'Licencia expirada' });
        }

        if (licencia.device_id && licencia.device_id !== device_id) {
            if (licencia.actual_activaciones >= licencia.max_activaciones) {
                return res.status(403).json({ success: false, message: 'Límite de activaciones alcanzado' });
            }
        }

        // Actualizar licencia
        await db.execute(
            'UPDATE licencias SET device_id = ?, fecha_activacion = NOW(), estado = "activa", actual_activaciones = actual_activaciones + 1 WHERE id = ?',
            [device_id, licencia.id]
        );

        res.json({
            success: true,
            message: 'Activación exitosa',
            data: {
                email: licencia.email,
                expira: licencia.fecha_expiracion,
                token: 'SIGNED_TOKEN_HERE' // Podrías usar JWT aquí para mayor seguridad
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Endpoint: /validate
app.post('/api/validate', async (req, res) => {
    const { clave, device_id } = req.body;

    try {
        const db = await getPool();
        const [rows] = await db.execute(
            'SELECT * FROM licencias WHERE clave = ? AND device_id = ?', 
            [clave, device_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Licencia no encontrada para este equipo' });
        }

        const licencia = rows[0];

        if (licencia.estado !== 'activa') {
            return res.status(403).json({ success: false, message: 'Licencia no activa' });
        }

        if (new Date(licencia.fecha_expiracion) < new Date()) {
            return res.status(403).json({ success: false, message: 'Licencia expirada' });
        }

        res.json({ success: true, expira: licencia.fecha_expiracion });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Admin Panel (Basic simulation)
app.get('/admin', (req, res) => {
    res.send('Panel de Administración de Licencias Arkhe (Próximamente)');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de licencias corriendo en puerto ${PORT}`);
});
