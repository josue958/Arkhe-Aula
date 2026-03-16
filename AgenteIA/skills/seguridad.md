# Skill: Seguridad

## Propósito
Este skill describe las medidas de seguridad implementadas en Arkhe Aula para proteger la propiedad intelectual y el sistema de licenciamiento.

## 1. Ofuscación de Código (javascript-obfuscator)

Para evitar la ingeniería inversa en el ejecutable de Electron, el código de los procesos `main`, `preload` y `handlers` se ofusca automáticamente durante el build.

### Configuración
El script `scripts/obfuscate.js` utiliza las siguientes opciones críticas:
- `compact: true`: Elimina saltos de línea y espacios.
- `controlFlowFlattening: true`: Introduce estructuras de control complejas.
- `deadCodeInjection: true`: Agrega código inútil para confundir.
- `stringArray: true`: Codifica todas las cadenas de texto del sistema.

### Ejecución
Se integra en el ciclo de vida de `npm run build`:
```bash
npm run build:vite -> npm run obfuscate -> electron-builder
```

## 2. Protección de Licencia Local

La licencia se guarda en un archivo llamado `license.dat` de forma local para permitir el uso **offline**.

- **Cifrado:** Utiliza `AES-256-CBC` mediante la librería `crypto-js`.
- **Clave de Cifrado:** Generada dinámicamente basada en el `MachineID` del equipo para que el archivo no sea portable entre computadoras.
- **Validación Decodificada:** Al iniciar la app, el sistema lee `license.dat`, lo descifra y verifica que el `device_id` coincida con el equipo actual.

## 3. Seguridad en el Servidor de Licencias

- **API Keys:** Las peticiones desde el cliente ocurren vía HTTPS hacia el servidor.
- **Admin Tokens:** Los endpoints sensibles (como `/api/revoke`) requieren un `ADMIN_TOKEN` configurado en las variables de entorno del servidor.
- **Salt & Hash:** Las claves de licencia se almacenan en la base de datos de forma segura (si son contraseñas) o como valores únicos.

## 4. GitHub Público y Descargas

- El repositorio es público para facilitar las actualizaciones, pero el código fuente "crudo" solo vive en la rama de desarrollo local del autor original.
- Los ejecutables públicos están **ofuscados**.
- No se deben subir archivos `.env` ni credenciales de base de datos al repositorio.

---

> [!CAUTION]
> **Nunca** distribuyas el archivo `license.dat` manualmente. Este archivo es único por hardware y no funcionará en otra máquina.
