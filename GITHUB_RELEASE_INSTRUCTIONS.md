# 🚀 Primer Release con GitHub - Instrucciones Paso a Paso

## ✅ Pre-requisitos Completados

- [x] Archivos FTP eliminados
- [x] package.json actualizado para GitHub Releases
- [x] Workflow de GitHub Actions creado (`.github/workflows/release.yml`)
- [x] electron/updater.js actualizado
- [x] electron/preload.js actualizado
- [x] ProfilePage.vue actualizado
- [x] Página de descargas creada (`public/downloads/index.html`)
- [x] agente.md actualizado

---

## 📋 PASO 1: Configurar GitHub Secrets

### 1.1 Generar GitHub Personal Access Token

1. Ve a: https://github.com/settings/tokens
2. Haz clic en **Generate new token (classic)**
3. Configura:
   - **Note:** `Arkhe Aula Releases`
   - **Expiration:** `No expiration` (o 90 días)
   - **Scopes:** Marca TODAS estas casillas:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
     - ✅ `write:packages` (Upload packages to GitHub Packages)
     - ✅ `delete:packages` (Delete packages from GitHub Packages)
4. Haz clic en **Generate token**
5. **COPIA EL TOKEN INMEDIATAMENTE** - Se ve como: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. Guárdalo en un lugar seguro (NO lo compartas)

### 1.2 Agregar Token a GitHub Secrets

1. Ve a tu repositorio: https://github.com/josue958/Arkhe-Aula
2. Haz clic en **Settings** (pestaña superior)
3. En el menú lateral, haz clic en **Secrets and variables** → **Actions**
4. Haz clic en **New repository secret**
5. Completa:
   - **Name:** `GH_TOKEN`
   - **Value:** (pega tu token `ghp_...`)
6. Haz clic en **Add secret**

### 1.3 Habilitar GitHub Actions

1. Ve a la pestaña **Actions** en tu repositorio
2. Si es la primera vez, verás un mensaje de bienvenida
3. Haz clic en **I understand my workflows, go ahead and enable them**

---

## 📋 PASO 2: Commit de los Cambios

```bash
# 1. Navega al proyecto
cd /Users/josue/Desktop/Sitios/Arke_Software

# 2. Verifica el estado
git status

# 3. Agrega todos los cambios
git add .

# 4. Haz commit
git commit -m "feat: migrar sistema de actualizaciones a GitHub Releases

- Eliminar scripts FTP obsoletos
- Configurar electron-builder para GitHub Releases
- Crear workflow de GitHub Actions
- Actualizar updater.js para GitHub
- Agregar página de descargas web
- Actualizar documentación

BREAKING CHANGE: Sistema de actualizaciones ahora usa GitHub Releases en lugar de servidor FTP"

# 5. Push a GitHub
git push origin main
```

---

## 📋 PASO 3: Crear Primer Release de Prueba

### 3.1 Actualizar Versión

```bash
# Verificar versión actual
npm version

# Crear nueva versión (patch, minor, o major)
npm version patch  # Ej: 1.12.7 → 1.12.8
```

### 3.2 Push del Tag

```bash
# Esto activa automáticamente GitHub Actions
git push origin v1.12.8
```

### 3.3 Verificar GitHub Actions

1. Ve a: https://github.com/josue958/Arkhe-Aula/actions
2. Deberías ver el workflow **Build and Release** ejecutándose
3. El proceso toma ~15-25 minutos
4. Verifica que ambos jobs (Windows y macOS) completen exitosamente

### 3.4 Verificar Release Draft

1. Ve a: https://github.com/josue958/Arkhe-Aula/releases
2. Verás un release draft con la versión v1.12.8
3. Revisa que todos los archivos estén adjuntos:
   - `Arkhe Aula Setup 1.12.8.exe` (Windows installer)
   - `Arkhe Aula-Portable-1.12.8.exe` (Windows portable)
   - `Arkhe Aula-1.12.8.dmg` (macOS Intel)
   - `Arkhe Aula-1.12.8-arm64.dmg` (macOS Apple Silicon)
   - `latest.yml` (manifiesto Windows)
   - `latest-mac.yml` (manifiesto macOS)

### 3.5 Publicar Release

1. Haz clic en el release draft
2. Revisa las notas del release (se generan automáticamente)
3. Haz clic en **Publish release**
4. ✅ ¡Listo! El release ahora es público

---

## 📋 PASO 4: Probar Actualización en el Software

### 4.1 Instalar Versión Anterior (si tienes)

Si tienes una versión instalada (ej: v1.12.7):

1. Abre Arkhe Aula
2. Ve a Perfil
3. Verifica la versión actual

### 4.2 Verificar Actualización

1. En Perfil, haz clic en **🔄 Verificar**
2. Debería mostrar: "🎉 Nueva versión disponible: v1.12.8"
3. Haz clic en **Descargar ahora**
4. Verifica que la descarga comience
5. Espera a que se complete la descarga
6. Cuando se muestre el diálogo, haz clic en **Reiniciar e instalar**
7. El software se reiniciará y se instalará la nueva versión

### 4.3 Verificar Versión Actualizada

1. Después del reinicio, ve a Perfil
2. Verifica que la versión ahora es v1.12.8
3. Verifica que tu base de datos y perfil se mantuvieron

---

## 📋 PASO 5: Plan de Pruebas Completo

### Prueba 1: Detección de Nueva Versión
- [ ] Instalar versión anterior (v1.12.7)
- [ ] Abrir Arkhe Aula
- [ ] Ir a Perfil → Buscar actualizaciones
- [ ] **VERIFICAR:** Muestra "Nueva versión disponible: v1.12.8"
- [ ] **VERIFICAR:** Muestra botón "Descargar e Instalar"

### Prueba 2: Descarga de Actualización
- [ ] Hacer clic en "Descargar e Instalar"
- [ ] **VERIFICAR:** Muestra barra de progreso
- [ ] **VERIFICAR:** La descarga se guarda en caché temporal
- [ ] **VERIFICAR:** No hay errores de autenticación
- [ ] **VERIFICAR:** El archivo se descarga completo

### Prueba 3: Instalación de Actualización
- [ ] Después de la descarga, muestra "Reiniciar para instalar"
- [ ] Hacer clic en "Reiniciar ahora"
- [ ] **VERIFICAR:** La aplicación se cierra
- [ ] **VERIFICAR:** El instalador se ejecuta automáticamente
- [ ] **VERIFICAR:** La nueva versión se instala
- [ ] **VERIFICAR:** La aplicación se reinicia con la nueva versión

### Prueba 4: Respaldo de Base de Datos
- [ ] Antes de actualizar, verificar que la BD existe
- [ ] Después de actualizar, verificar que la BD persiste
- [ ] **VERIFICAR:** Los datos de usuarios se mantienen
- [ ] **VERIFICAR:** Los grupos y alumnos se mantienen
- [ ] **VERIFICAR:** Las calificaciones se mantienen

### Prueba 5: Respaldo de Perfil
- [ ] Antes de actualizar, exportar perfil manualmente
- [ ] Después de actualizar, verificar configuración
- [ ] **VERIFICAR:** Las preferencias se mantienen
- [ ] **VERIFICAR:** La configuración de auto-backup se mantiene

### Prueba 6: Actualización Automática al Inicio
- [ ] Activar "Actualizaciones automáticas" en Perfil
- [ ] Cerrar la aplicación
- [ ] Abrir la aplicación
- [ ] **VERIFICAR:** Busca actualizaciones automáticamente
- [ ] **VERIFICAR:** Notifica si hay nueva versión

### Prueba 7: Conexión a GitHub
- [ ] Con internet: Debe conectar y verificar versión
- [ ] Sin internet: Debe mostrar error de conexión
- [ ] **VERIFICAR:** El mensaje de error es claro

### Prueba 8: Versión Actualizada
- [ ] Ir a Perfil → Acerca de
- [ ] **VERIFICAR:** La versión muestra v1.12.8
- [ ] **VERIFICAR:** El build number es correcto

### Prueba 9: Página de Descargas Web
- [ ] Abrir https://arkhegroup.com/downloads/
- [ ] **VERIFICAR:** Muestra la última versión
- [ ] **VERIFICAR:** Muestra opciones para Windows
- [ ] **VERIFICAR:** Muestra opciones para macOS
- [ ] **VERIFICAR:** Los enlaces de descarga funcionan

### Prueba 10: GitHub Release
- [ ] Ir a https://github.com/josue958/Arkhe-Aula/releases
- [ ] **VERIFICAR:** El release v1.12.8 está publicado
- [ ] **VERIFICAR:** Todos los archivos están presentes
- [ ] **VERIFICAR:** Los archivos se pueden descargar

---

## 📋 PASO 6: Solución de Problemas Comunes

### Problema: GitHub Actions no se ejecuta

**Causa:** Actions no está habilitado o el tag no sigue el formato correcto

**Solución:**
```bash
# Verificar que el tag existe
git tag -l

# Verificar formato del tag (debe ser v*)
git push origin v1.12.8

# Si el tag no se creó, créalo manualmente
git tag v1.12.8
git push origin v1.12.8
```

### Problema: Error de autenticación en GitHub Actions

**Causa:** `GH_TOKEN` no está configurado o es inválido

**Solución:**
1. Ve a Settings → Secrets and variables → Actions
2. Verifica que `GH_TOKEN` existe
3. Si es necesario, genera un nuevo token y actualiza el secret

### Problema: El software no detecta la actualización

**Causa:** El release no está publicado o hay problema de caché

**Solución:**
```bash
# En el software, forzar verificación
# Ve a Perfil → Verificar actualizaciones

# Si no funciona, reinicia la aplicación
# O verifica que el release esté publicado en GitHub
```

### Problema: Error de descarga

**Causa:** Problema de red o el release no tiene los archivos correctos

**Solución:**
1. Verifica que el release tenga todos los archivos
2. Verifica que `latest.yml` esté presente
3. Intenta descargar manualmente desde GitHub Releases

---

## 📋 PASO 7: Limpieza (Opcional)

### Eliminar Archivos del Servidor FTP

**⚠️ ADVERTENCIA:** Solo haz esto después de verificar que GitHub Releases funciona correctamente.

```bash
# Conéctate a tu servidor FTP
# Navega a /updates/arkhe-aula/
# Elimina todos los archivos (o muévelos a una carpeta de backup)
```

### Configurar Redireccionamiento (Opcional)

Si quieres que la URL antigua redirija a GitHub:

**Archivo:** `.htaccess` en `arkhegroup.com/updates/arkhe-aula/`

```apache
Redirect 301 /updates/arkhe-aula/ https://github.com/josue958/Arkhe-Aula/releases/latest
```

---

## ✅ Checklist Final

### Configuración
- [ ] GitHub token generado y guardado
- [ ] Secret `GH_TOKEN` configurado en GitHub
- [ ] GitHub Actions habilitado
- [ ] Cambios commiteados y pusheados

### Primer Release
- [ ] Versión actualizada con `npm version patch`
- [ ] Tag pusheado a GitHub
- [ ] GitHub Actions completado exitosamente
- [ ] Release draft revisado
- [ ] Release publicado

### Pruebas
- [ ] Detección de actualización (Prueba 1)
- [ ] Descarga (Prueba 2)
- [ ] Instalación (Prueba 3)
- [ ] Respaldo BD (Prueba 4)
- [ ] Respaldo Perfil (Prueba 5)
- [ ] Auto-update (Prueba 6)
- [ ] Conexión GitHub (Prueba 7)
- [ ] Versión actualizada (Prueba 8)
- [ ] Página web (Prueba 9)
- [ ] GitHub Release (Prueba 10)

### Documentación
- [ ] agente.md actualizado
- [ ] README del repositorio actualizado
- [ ] Equipo notificado del cambio

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs de GitHub Actions:** https://github.com/josue958/Arkhe-Aula/actions
2. **Verifica el release:** https://github.com/josue958/Arkhe-Aula/releases
3. **Consulta la documentación:** `documentacion/` en el repositorio
4. **Revisa los errores en el software:** Abre la consola de DevTools (F12)

---

**¡Éxito con tu primer release en GitHub! 🎉**
