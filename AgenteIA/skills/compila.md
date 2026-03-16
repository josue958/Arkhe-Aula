# Skill: Compila

## Propósito

Este skill contiene las instrucciones exactas para realizar builds y construcciones de versiones del proyecto Arkhe Aula.

## ⚠️ NUEVO FLUJO DE VERSIONES (OPCIÓN A)

**DESDE LA VERSIÓN 1.12.8, EL REPOSITORIO EN GITHUB ES UN PORTAL DE DESCARGAS Y DOCUMENTACIÓN.**

Para mantener el repositorio limpio y evitar errores de servidor, el flujo de trabajo es el siguiente:

1.  **Rama `desarrollo`**: Todo el desarrollo y las compilaciones se realizan en esta rama. Tu código fuente vive aquí.
2.  **Rama `main`**: Solo contiene el archivo `agente.md`, los skills de la `AgenteIA/` y el portal de descargas. Es la cara pública del proyecto.
3.  **Compilación Local**: La compilación se realiza en tu Mac (es más rápida y fiable).
4.  **Publicación Directa**: Al ejecutar `npm run release`, el sistema compila localmente y **sube automáticamente** los instaladores a la sección de **Releases de GitHub**.

**Comando para lanzar una nueva versión:**
```bash
# 1. Asegúrate de estar en la rama de desarrollo
git checkout desarrollo

# 2. Configura tu Token (Solo la primera vez)
# Crea un archivo .env en la raíz y añade:
# GH_TOKEN=tu_token_de_github

# 3. Lanza el release completo
# Esto: Compila (Win/Mac) -> Organiza Versión -> Commit -> Tag -> Sube a GitHub directamente
npm run release

# O si solo quieres subir archivos ya compilados:
npm run upload:github
```

> **Nota:** La compilación ahora es 100% local en tu equipo. GitHub Actions ya no compila el código (evitando errores de servidor), solo recibe los archivos terminados.


---


## Comandos de Construcción

### Build General (Windows y macOS)

```bash
npm run build
```

- Construye para ambas plataformas (Windows y macOS)
- Genera instaladores y versiones portables
- Ejecuta post-build scripts

### Build Solo Windows

```bash
npm run build:win
```

- Genera instalador NSIS (x64, ia32)
- Genera versión portable (x64)
- Output: carpeta `Ejecutables/`

### Build Solo macOS

```bash
npm run build:mac
```

- Genera DMG (x64, arm64)
- Genera ZIP (x64, arm64)
- Output: carpeta `Ejecutables/`

### Build Solo Vite (Frontend)

```bash
npm run build:vite
```

- Compila el frontend a la carpeta `dist/`
- No incluye empaquetado de Electron

## Flujo de Trabajo para Nueva Versión

### 1. Verificar Versión Actual

```bash
npm version
```

### 2. Actualizar Versión (si es necesario)

```bash
# Patch (1.11.0 -> 1.11.1) - Correcciones de bugs menores
npm version patch

# Minor (1.11.0 -> 1.12.0) - Nuevas funcionalidades backwards-compatible
npm version minor

# Major (1.11.0 -> 2.0.0) - Cambios breaking
npm version major
```

**Regla:** El versionado debe seguir **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

### 3. Limpiar Build Anterior

```bash
rm -rf dist/
# NOTA: No eliminar Ejecutables/ completo para preservar versiones anteriores
```

### 4. Ejecutar Build

```bash
# Para la plataforma específica
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build        # Ambas plataformas
```

### 5. Organizar por Versión (Buena Práctica)

**Importante:** Cada nueva versión guardará los archivos compilados en una carpeta con el número de versión dentro de `Ejecutables/` (Ej. `Ejecutables/v1.11.0/`).

> **Nota:** Esto ya lo realiza de manera completamente automática el script `scripts/post-build.js` al finalizar el build con `npm run build`. Los archivos ejecutables se moverán a la versión correspondiente para no ocupar espacio doble. No necesitas ejecutar ningún comando manual para mover los archivos.

> **IMPORTANTE:** El script `post-build.js` también actualiza automáticamente el archivo `agente.md` con la nueva versión después de cada compilación.

**Estructura Resultante:**

```text
Ejecutables/
├── v1.11.0/
│   ├── Arkhe Aula Setup 1.11.0.exe
│   ├── Arkhe Aula-Portable-1.11.0.exe
│   ├── Arkhe Aula-1.11.0.dmg
│   └── latest.yml
├── v1.11.1/
│   └── ...
└── v1.12.0/
    └── ...
```

### 6. Verificar Output (AUTOMÁTICO)

**Después del build, el sistema automáticamente:**

1. **Organiza archivos por versión** en `Ejecutables/v{VERSION}/`
2. **Actualiza `agente.md`** con la nueva versión
3. **Crea commit y tag** de la versión
4. **Hace push a GitHub** (main + tags)
5. **Activa GitHub Actions** para compilar

**Verifica en GitHub:**

1. **Actions:** https://github.com/josue958/Arkhe-Aula/actions
   - Espera ~15-25 minutos
   - Verifica que ambos builds (Windows y macOS) terminen exitosamente

2. **Releases:** https://github.com/josue958/Arkhe-Aula/releases
   - Verifica que se creó el release draft
   - Revisa que todos los archivos estén presentes:
     - `Arkhe Aula Setup {version}.exe`
     - `Arkhe Aula-Portable-{version}.exe`
     - `Arkhe Aula-{version}.dmg`
     - `Arkhe Aula-{version}-arm64.dmg`
     - `latest.yml`
     - `latest-mac.yml`

3. **Publica el release** cuando estés listo

**Verifica en la aplicación:**

- Revisar carpeta `Ejecutables/v{VERSION}/`
- Validar versión en `About` de la aplicación
- Después de publicar: Perfil → Verificar actualizaciones

---

## ⚠️ REGLA OBLIGATORIA DE FINALIZACIÓN

**IMPORTANTE:** Después de cada corrección, actualización o generación de nuevas secciones, **DEBES** concluir el proceso SIEMPRE con:

### 1. Actualización de Versión (Automática)

**El sistema actualiza la versión automáticamente** al ejecutar `npm run build`.

Si necesitas actualizar manualmente ANTES del build:

```bash
# Determinar tipo de cambio:
npm version patch    # Bug fixes (ej: 1.12.7 → 1.12.8)
npm version minor    # Nuevas funcionalidades (ej: 1.12.7 → 1.13.0)
npm version major    # Cambios breaking (ej: 1.12.7 → 2.0.0)
```

**Regla de versionado:**

- **PATCH:** Bug fixes, correcciones de errores, pequeños ajustes
- **MINOR:** Nuevas funcionalidades backwards-compatible
- **MAJOR:** Cambios breaking, refactorizaciones grandes

### 2. Build Completo (CON PUBLICACIÓN AUTOMÁTICA)

```bash
# Build para TODAS las plataformas (PUBLICA A GITHUB AUTOMÁTICAMENTE)
npm run build

# O builds específicos (TAMBIÉN PUBLICAN AUTOMÁTICAMENTE)
npm run build:win    # Windows
npm run build:mac    # macOS
```

### 3. Verificación Final (EN GITHUB)

**Es crucial validar que la compilación termine con estado SUCCESS (Éxito).**

```bash
# Verificar GitHub Actions
# Ve a: https://github.com/josue958/Arkhe-Aula/actions

# Verificar que los workflows completaron exitosamente
# Debe mostrar ✅ (checkmark verde) en ambos builds (Windows y macOS)
```

```bash
# Verificar logs de build final para asegurar que se ejecutó sin salidas de error (Exit code 0)
# En GitHub Actions, haz clic en el workflow → Revisa los logs
# Busca: "SUCCESS" o "✓ built"
```

> **⚠️ REGLA DE CORRECCIÓN AUTOMÁTICA:**
> - Si durante el paso de compilación (`npm run build`) ocurre algún error arrojando algo diferente a **SUCCESS** o **Exit code 0**, NO puedes ignorarlo.
> - Si la compilación no se genera correctamente debido a un problema con los scripts del propio build o configuraciones, **debes volver a revisar el skill `compila.md` y corregir el error aquí mismo en las configuraciones/pasos (o en el script en fallo)**, repitiendo el proceso hasta que la compilación concluya enteramente con estatus OK.
> - El proceso de compilación NO está finalizado si hubieron errores en la terminal.

### 4. Verificar Release en GitHub

Después de que GitHub Actions termine (~15-25 minutos):

```bash
# Verificar Release Draft
# Ve a: https://github.com/josue958/Arkhe-Aula/releases

# Verificar que el release draft tenga:
# - Todos los archivos adjuntos (.exe, .dmg, .zip, .yml)
# - La versión correcta en el tag
# - Notas del release generadas automáticamente
```

### 5. Publicar Release (MANUAL)

```bash
# 1. Ve a GitHub Releases
# 2. Haz clic en el release draft v{VERSION}
# 3. Revisa las notas del release
# 4. Haz clic en "Publish release"
# 5. ¡LISTO! Los usuarios ahora pueden descargar
```

### 6. Documentar en Contexto

- Actualizar `AgenteIA/contexto/` con fecha y cambios
- Registrar en `log/transactions_*.log`

---

### Flujo de Finalización Obligatorio (AUTOMÁTICO)

```text
CAMBIO REALIZADO
    ↓
npm version [patch|minor|major]  (OPCIONAL, si necesitas control manual)
    ↓
npm run build  (AUTOMÁTICO: commit, tag, push, GitHub Actions)
    ↓
ESPERAR GitHub Actions (~15-25 min)
    ↓
VERIFICAR Actions: ✅ SUCCESS
    ↓
    ├── [Si FALLÓ]: Revisar error en GitHub Actions, corregir, repetir build.
    └── [Si PASÓ]: Verificar Release Draft
            ↓
       REVISAR Release Draft en GitHub
            ↓
       PUBLICAR Release (manual)
            ↓
       Documentar en contexto/
            ↓
       LOG: SUCCESS - Build y publicación completados
```

**NOTA:** El proceso de build y publicación a GitHub es automático. Solo necesitas publicar el release draft manualmente después de verificar que todo está correcto.

## Buenas Prácticas de Compilación

### Antes del Build

1. **Verificar tests:** Todos los tests deben pasar
   ```bash
   npm run test:run
   ```

2. **Linting:** El código debe estar libre de errores
   ```bash
   npm run lint
   ```

3. **Changelog:** Actualizar `CHANGELOG.md` con los cambios de la versión

4. **Git limpio:** Todos los cambios deben estar commiteados
   ```bash
   git status
   git add .
   git commit -m "chore: preparación para release v{VERSION}"
   ```

5. **Tags:** Crear tag de la versión
   ```bash
   git tag -a v{VERSION} -m "Release v{VERSION}"
   git push origin v{VERSION}
   ```

### Durante el Build

1. **No interrumpir:** Esperar a que el proceso termine completamente
2. **Monitorear logs:** Verificar que no haya warnings críticos
3. **Recursos:** Asegurar que hay espacio en disco suficiente

### Después del Build

1. **Verificar integridad:** Los ejecutables deben abrir correctamente
2. **Probar instalación:** Instalar en un entorno limpio
3. **Backup:** Copiar la versión a almacenamiento seguro
4. **Documentar:** Registrar en `contexto/` cualquier incidencia

### Versionado Semántico (SemVer)

| Tipo | Cuándo Usar | Ejemplo |
| :--- | :--- | :--- |
| **PATCH** | Bug fixes, cambios menores internos | 1.11.0 → 1.11.1 |
| **MINOR** | Nuevas funcionalidades backwards-compatible | 1.11.0 → 1.12.0 |
| **MAJOR** | Cambios breaking, refactorizaciones grandes | 1.11.0 → 2.0.0 |

### Control de Versiones en Ejecutables

- Cada versión debe tener su propia carpeta `v{VERSION}`
- Nunca sobrescribir versiones anteriores
- Mantener al menos las últimas 3 versiones
- Archivar versiones antiguas en almacenamiento externo

---

## Subida al Servidor de Actualizaciones

### Configuración del Servidor

#### Datos de Conexión

| Parámetro | Valor |
| :--- | :--- |
| **Servidor FTP** | `ftp.arkhegroup.com` / `69.6.201.149` |
| **Usuario** | `Arkhe_Soft@arkhegroup.com` |
| **Contraseña** | `guFvu4-zuxcev-wemgop` |
| **Puerto/Tipo** | `21` / FTPS o FTP sin cifrado según test |
| **Canal Updates** | `latest` (para electron-updater) |
| **URL Base Updates** | `https://arkhegroup.com/updates/arkhe-aula/` |

### Archivos a Subir

Después de cada build completo, la carpeta `Ejecutables/v{VERSION}/` contendrá todos los ejecutables y archivos necesarios. Al ejecutar el comando de release, estos se subirán solos a `public_html/updates/arkhe-aula/` en el servidor y publicarán la actualización.

### Script de Subida Automática con basic-ftp

```javascript
// scripts/upload-release.js
const ftp = require("basic-ftp");
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = pkg.version;
const outputDir = path.join(__dirname, '..', 'Ejecutables', `v${version}`);

async function uploadRelease() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        console.log(`📦 Conectando a FTP para subir la versión v${version}...`);
        await client.access({
            host: "69.6.201.149", // o ftp.arkhegroup.com
            user: "Arkhe_Soft@arkhegroup.com",
            password: "guFvu4-zuxcev-wemgop",
            secure: false
        });
        
        // Directorio remoto: public_html/updates/arkhe-aula
        let targetDir = "public_html/updates/arkhe-aula"; 

        try {
            await client.cd("/");
            await client.ensureDir(targetDir);
            console.log(`📂 Ubicados en el directorio FTP remoto: ${targetDir}`);
        } catch(e) {
            console.error("No se pudo ir al targetDir", e);
            throw e;
        }
        
        const filesToUpload = fs.readdirSync(outputDir);
        
        // 1. Subir Manifiestos
        for (const file of filesToUpload) {
            const localPath = path.join(outputDir, file);
            if (fs.statSync(localPath).isFile()) {
                if (file.endsWith('.yml') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.htaccess')) {
                    console.log(`Subiendo manifiesto o web: ${file}...`);
                    await client.uploadFrom(localPath, file);
                }
            }
        }
        
        // 2. Subir Ejecutables dentro de su carpeta de versión
        await client.ensureDir(`v${version}`);
        console.log(`📂 Entrando al directorio FTP remoto: v${version}`);
        await client.cd(`v${version}`);
        
        for (const file of filesToUpload) {
            const localPath = path.join(outputDir, file);
            if (fs.statSync(localPath).isFile()) {
                if (!file.endsWith('.yml') && !file.endsWith('.json') && !file.endsWith('.html') && !file.endsWith('.htaccess')) {
                    console.log(`Subiendo ejecutable: ${file}...`);
                    await client.uploadFrom(localPath, file);
                }
            }
        }
        console.log(`✅ Versión v${version} subida correctamente`);
    } catch(err) {
        console.error("❌ Error de subida FTP:", err);
    }
    client.close();
}

uploadRelease();
```

### Comandos de Subida

```bash
# Ejecutar subir versión al servidor (FTP automático)
npm run upload-release
```

### Agregar a package.json

Asegúrate de que está definido en la sección "scripts":

```json
{
  "scripts": {
    "upload-release": "node scripts/upload-release.js"
  }
}
```

### Flujo Completo de Publicación

```bash
# 1. Actualizar versión
npm version patch    # o minor / major

# 2. Ejecutar build
npm run build:win    # o build:mac / build

# 3. Verificar archivos generados
ls -la Ejecutables/v*/

# 4. Subir al servidor
npm run upload-release

# 5. Verificar en el servidor
ssh arkhe_deploy@arkhegroup.com "ls -la /var/www/arkhegroup.com/updates/arkhe-aula/"

# 6. Crear tag en git
git push origin v$(node -p "require('./package.json').version")
```

### Verificación de Actualización

Después de subir los archivos:

1. **Verificar accesibilidad:**
   ```bash
   curl https://arkhegroup.com/updates/arkhe-aula/latest.yml
   ```

2. **Verificar desde la aplicación:**
   - Abrir Arkhe Aula
   - Ir a Configuración → Actualizaciones
   - Click en "Buscar actualizaciones"
   - Debe detectar la nueva versión

### Consideraciones Importantes

- **Orden de subida:** Primero los ejecutables, luego los archivos `.yml`
- **Permisos:** Asegurar que los archivos tengan permisos de lectura (644)
- **Backup:** Mantener una copia local de los archivos subidos
- **Rollback:** En caso de error, restaurar el `latest.yml` anterior

### Solución de Problemas

#### Error: "Permission denied"

```bash
# Verificar permisos SSH
ssh -T arkhe_deploy@arkhegroup.com
```

#### Error: "File not found"

Verificar que la ruta del servidor sea correcta y que los archivos existan localmente.

#### La actualización no aparece

1. Verificar que `latest.yml` tenga la versión correcta
2. Limpiar caché del updater en la aplicación
3. Reiniciar la aplicación

## Configuración de electron-builder

### Ubicación

La configuración está en `package.json` bajo la clave `build`.

### Puntos Clave

- **appId:** `com.arkhegroup.arkhe-aula`
- **productName:** `Arkhe Aula`
- **Output:** `Ejecutables/`
- **Recursos extra:** carpeta `documentacion/`

### Actualizaciones

- **Proveedor:** generic
- **URL:** `https://arkhegroup.com/updates/arkhe-aula/`
- **Canal:** latest

## Consideraciones Importantes

### macOS

- Requiere firmar la aplicación para distribución
- `identity: null` para desarrollo local
- Soporta Dark Mode

### Windows

- NSIS permite instalación personalizada
- Versión portable no requiere instalación
- Icono ubicado en `build/icon.png`

### Post-Build

El script `scripts/post-build.js` se ejecuta automáticamente después del build para:
- Copiar recursos adicionales
- Generar documentación
- Validar integridad del build

## Solución de Problemas Comunes

### Error: "Cannot find module"

```bash
npm install
rm -rf node_modules
npm install
```

### Error en macOS: "identity not found"

Verificar que `identity: null` esté configurado para desarrollo.

### Build muy lento

```bash
# Limpiar caché de Vite
rm -rf node_modules/.vite
```

### Error de permisos en Windows

Ejecutar terminal como administrador.
