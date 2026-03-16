require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir el Panel de Administración (Estático)
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Rutas de la API
const apiRoutes = require('./api/index.js');
app.use('/api', apiRoutes);

// Por ahora, el archivo api/index.js que moví tiene todo el servidor. 
// Vamos a refactorizarlo para que sea un router o simplemente ejecutarlo.
// Pero la mejor práctica es tener el app.listen aquí.

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de licencias Arkhe corriendo en: http://localhost:${PORT}`);
    console.log(`Panel Admin: http://localhost:${PORT}/admin`);
});
