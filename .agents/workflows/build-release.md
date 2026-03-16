---
description: Compilar Arkhe Aula para Windows y Mac con carpeta de release versionada
---

# Flujo de Compilación — Arkhe Aula

// turbo-all

## Pasos

1. **Incrementar versión** en `package.json` siguiendo semver:
   - Corrección de bug → patch (1.10.5 → 1.10.6)
   - Nueva funcionalidad → minor (1.10.5 → 1.11.0)
   - Cambio mayor → major (1.10.5 → 2.0.0)

2. **Compilar** para Windows y macOS (el script `post-build.js` se ejecuta automáticamente):
   ```
   npm run build
   ```
   Esto hace:
   - `vite build` → genera `dist/`
   - `electron-builder --win --mac` → genera instaladores en `Ejecutables/`
   - `node scripts/post-build.js` → copia los archivos de actualización a `Ejecutables/release/Arkhe Aula-{version}/`

3. **Verificar carpeta de release** generada en:
   ```
   Ejecutables/release/Arkhe Aula-{version}/
   ```
   Esta carpeta contiene los archivos listos para subir al servidor de actualizaciones.

4. **Subir al servidor de actualizaciones** la carpeta de release en:
   ```
   https://arkhegroup.com/updates/arkhe-aula/
   ```
   Los archivos clave son:
   - `latest.yml` → metadatos de versión Windows
   - `latest-mac.yml` → metadatos de versión macOS
   - `Arkhe Aula Setup {version}.exe` → instalador Windows
   - `Arkhe Aula-{version}.dmg` → instalador macOS Intel
   - `Arkhe Aula-{version}-arm64.dmg` → instalador macOS Apple Silicon
   - `Arkhe Aula-{version}-mac.zip` → ZIP macOS Intel
   - `Arkhe Aula-{version}-arm64-mac.zip` → ZIP macOS Apple Silicon
   - Archivos `.blockmap` y `.7z` (para actualizaciones diferenciales)

## Recordatorio

Si olvidas cómo compilar, dile al asistente:
> "Compila Arkhe Aula con la carpeta de release para el servidor de actualizaciones"

O simplemente ejecuta:
```
npm run build
```

El script post-build ya genera la carpeta automáticamente.

## Validación del servidor de actualizaciones

Verificar que el servidor responde correctamente:
```
curl -sk -o /dev/null -w "%{http_code}" https://arkhegroup.com/updates/arkhe-aula/latest.yml
```
- `200` → Servidor activo, archivos subidos ✅
- `404` → Archivos no subidos aún ⚠️
- `000` → Sin conexión al servidor ❌
