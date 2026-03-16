-- Database schema for Arkhe License Server
CREATE DATABASE IF NOT EXISTS arkhe_licencias;
USE arkhe_licencias;

CREATE TABLE IF NOT EXISTS licencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    clave VARCHAR(50) NOT NULL UNIQUE,
    device_id VARCHAR(255) DEFAULT NULL,
    fecha_activacion DATETIME DEFAULT NULL,
    fecha_expiracion DATETIME NOT NULL,
    estado ENUM('activa', 'revocada', 'expirada', 'pendiente') DEFAULT 'pendiente',
    max_activaciones INT DEFAULT 1,
    actual_activaciones INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios_admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserción de prueba: Licencia de ejemplo
INSERT INTO licencias (email, clave, fecha_expiracion, estado) 
VALUES ('demo@arkhegroup.com', 'ARKHE-1234-ABCD-8899', '2027-01-01 00:00:00', 'pendiente');
