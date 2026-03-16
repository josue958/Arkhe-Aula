# GitHub Workflows para Arkhe Aula

## Configuración Requerida

### 1. GitHub Secrets

Debes configurar los siguientes secrets en tu repositorio:

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**

| Nombre | Valor | Descripción |
|--------|-------|-------------|
| `GH_TOKEN` | (tu token) | Token de GitHub para publicar releases |

**Para obtener GH_TOKEN:**
1. Ve a https://github.com/settings/tokens
2. Generate new token (classic)
3. Scopes requeridos: `repo`, `workflow`, `write:packages`
4. Copia el token y guárdalo en Secrets

### 2. Habilitar GitHub Actions

1. Ve a la pestaña **Actions** en tu repositorio
2. Si es la primera vez, haz clic en **I understand my workflows, go ahead and enable them**

## Cómo Publicar una Nueva Versión

### Método Automático (Recomendado)

```bash
# 1. Actualizar versión (elige uno)
npm version patch    # 1.12.7 → 1.12.8 (bug fixes)
npm version minor    # 1.12.7 → 1.13.0 (nuevas funcionalidades)
npm version major    # 1.12.7 → 2.0.0 (cambios breaking)

# 2. Push del tag (esto activa el workflow)
git push origin v1.12.8

# 3. Esperar a que GitHub Actions compile
# Ve a: https://github.com/josue958/Arkhe-Aula/actions

# 4. Publicar el release (manual)
# Ve a: https://github.com/josue958/Arkhe-Aula/releases
# El release se crea como draft - revísalo y publícalo
```

### Método Manual (Desde GitHub)

1. Ve a **Actions** en tu repositorio
2. Selecciona **Build and Release**
3. Haz clic en **Run workflow**
4. Selecciona la rama (main)
5. Haz clic en **Run workflow**

## Flujo del Workflow

```
Push de tag (v*) 
    ↓
GitHub Actions se activa
    ↓
Build en Windows (windows-latest)
    ↓
Build en macOS (macos-latest)
    ↓
Descarga de artifacts
    ↓
Creación de Release Draft
    ↓
Revisión manual y publicación
```

## Archivos Generados

### Windows
- `Arkhe Aula Setup {version}.exe` (instalador NSIS)
- `Arkhe Aula-Portable-{version}.exe` (versión portable)
- `latest.yml` (manifiesto de actualizaciones)

### macOS
- `Arkhe Aula-{version}.dmg` (instalador DMG x64)
- `Arkhe Aula-{version}-arm64.dmg` (instalador DMG arm64)
- `Arkhe Aula-{version}-mac.zip` (ZIP x64)
- `Arkhe Aula-{version}-arm64-mac.zip` (ZIP arm64)
- `latest-mac.yml` (manifiesto de actualizaciones macOS)

## Solución de Problemas

### El workflow no se ejecuta
- Verifica que Actions esté habilitado
- Verifica que el tag siga el formato `v*` (ej: v1.12.8)

### Error de autenticación
- Verifica que `GH_TOKEN` esté configurado en Secrets
- Verifica que el token tenga los permisos necesarios

### Build falla en macOS
- Error de código: Es normal en desarrollo (identity: null)
- Error de Node: Verifica la versión en setup-node

### Release no se crea
- Verifica que los artifacts se hayan subido correctamente
- Revisa los logs de GitHub Actions

---

**Repositorio:** https://github.com/josue958/Arkhe-Aula
**Documentación:** Ver `documentacion/` en el repositorio
