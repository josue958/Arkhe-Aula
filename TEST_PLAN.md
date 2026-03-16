# 🧪 PLAN DE PRUEBAS - GitHub Releases

## ✅ PRUEBAS REALIZADAS

### Prueba 1: Build Vite ✅
```bash
npm run build:vite
```
**Resultado:** ✅ Exitoso
- Build completado en 4.33s
- Sin errores de compilación
- Todos los archivos generados correctamente

---

## 📋 PRUEBAS PENDIENTES

### Prueba 2: Build Completo (Requiere GitHub Configurado)

**PRE-REQUISITOS:**
- [ ] GitHub token generado
- [ ] Secret `GH_TOKEN` configurado en GitHub
- [ ] GitHub Actions habilitado

**EJECUCIÓN:**
```bash
npm run build
```

**RESULTADO ESPERADO:**
```
✅ Build Vite completado
✅ Build Electron completado
✅ post-build.js ejecutado
🚀 Preparando publicación automática a GitHub Releases...
📍 Rama actual: main
✅ Cambios commiteados
✅ Tag creado: v1.12.8
📤 Subiendo a GitHub (commits + tags)...
✅ Push completado a GitHub

============================================================
🎉 ¡BUILD Y PUBLICACIÓN COMPLETADOS!
============================================================

📦 GitHub Actions está compilando tu release...
   👉 https://github.com/josue958/Arkhe-Aula/actions

⏱️  El proceso tomará ~15-25 minutos.

📝 Cuando termine:
   1. Ve a Releases en GitHub
   2. Revisa el release draft v1.12.8
   3. Publica el release cuando estés listo

🔗 Release Draft:
   https://github.com/josue958/Arkhe-Aula/releases

============================================================
```

**VERIFICAR EN GITHUB:**
- [ ] Ir a Actions: https://github.com/josue958/Arkhe-Aula/actions
- [ ] Verificar que "Build and Release" se está ejecutando
- [ ] Esperar ~15-25 minutos
- [ ] Verificar que ambos builds (Windows y macOS) terminen con ✅
- [ ] Ir a Releases: https://github.com/josue958/Arkhe-Aula/releases
- [ ] Verificar release draft v1.12.8
- [ ] Verificar archivos adjuntos
- [ ] Publicar release

---

### Prueba 3: Actualización Automática en la App

**PRE-REQUISITOS:**
- [ ] Release publicado en GitHub
- [ ] App instalada (versión anterior)

**EJECUCIÓN:**
1. Abre Arkhe Aula
2. Ve a Perfil
3. Activa "Actualizaciones automáticas" (toggle)
4. Cierra la app
5. Abre la app nuevamente

**RESULTADO ESPERADO:**
```
[Updater] Actualizaciones automáticas: Activadas
[Updater] Verificando actualizaciones desde GitHub Releases...
[Updater] Última versión en GitHub: 1.12.8
```

**VERIFICAR:**
- [ ] La app verifica actualizaciones al inicio (~3 segundos)
- [ ] Si hay nueva versión, muestra diálogo:
  ```
  ¡Arkhe Aula 1.12.8 está disponible!
  
  Versión actual: 1.12.7
  Nueva versión: 1.12.8
  
  La actualización se descargará automáticamente. 
  Una vez completada, podrás reiniciar para instalar.
  
  [Descargar ahora] [Más tarde]
  ```

---

### Prueba 4: Verificación Manual de Actualizaciones

**EJECUCIÓN:**
1. Abre Arkhe Aula
2. Ve a Perfil
3. Haz clic en "🔄 Verificar"

**RESULTADO ESPERADO:**

**Si NO hay actualización:**
```
✅ No hay actualizaciones disponibles. 
Versión actual: v1.12.8
```

**Si HAY actualización:**
```
🎉 Nueva versión disponible: v1.12.9
```

**VERIFICAR:**
- [ ] Botón "Verificar" funciona
- [ ] Muestra spinner mientras verifica
- [ ] Muestra mensaje claro del resultado
- [ ] El mensaje tiene el ícono correcto (✅/🎉/❌)

---

### Prueba 5: Descarga e Instalación de Actualización

**PRE-REQUISITOS:**
- [ ] Hay una nueva versión disponible en GitHub
- [ ] Release publicado

**EJECUCIÓN:**
1. En Perfil → Verificar
2. Cuando muestre "Nueva versión disponible"
3. Haz clic en "Descargar ahora"

**RESULTADO ESPERADO:**
```
[Updater] Downloading update...
[Updater] Download progress: XX%
[Updater] Update downloaded
```

**DIÁLOGO DE INSTALACIÓN:**
```
Arkhe Aula 1.12.8 está lista para instalar.

Se realizará un respaldo automático de tu base de datos 
antes de actualizar.

¿Deseas reiniciar ahora para completar la instalación?

[Reiniciar e instalar] [Después]
```

**VERIFICAR:**
- [ ] Barra de progreso visible
- [ ] Descarga se completa sin errores
- [ ] Diálogo de instalación aparece
- [ ] Al hacer clic en "Reiniciar e instalar":
  - La app se cierra
  - El instalador se ejecuta
  - La app se reinstala
  - La app se abre con la nueva versión

---

### Prueba 6: Respaldo de Base de Datos

**PRE-REQUISITOS:**
- [ ] Base de datos con datos (grupos, alumnos, calificaciones)

**EJECUCIÓN:**
1. Antes de actualizar, verifica que los datos existen
2. Realiza la actualización
3. Después de actualizar, verifica los datos

**RESULTADO ESPERADO:**
- [ ] Base de datos persiste después de la actualización
- [ ] Todos los grupos se mantienen
- [ ] Todos los alumnos se mantienen
- [ ] Todas las calificaciones se mantienen
- [ ] Configuración del usuario se mantiene

**VERIFICAR EN LA APP:**
- [ ] Ir a Grupos → Verificar que existen
- [ ] Ir a Alumnos → Verificar que existen
- [ ] Ir a Evaluación → Verificar calificaciones
- [ ] Ir a Perfil → Verificar configuración

---

### Prueba 7: Página de Descargas Web

**EJECUCIÓN:**
1. Abre: https://arkhegroup.com/downloads/

**RESULTADO ESPERADO:**
```
┌─────────────────────────────────────────┐
│         📚 Arkhe Aula                   │
│  Sistema de Evaluación Docente          │
│                                         │
│  Última versión: v1.12.8                │
│                                         │
│  ┌──────────────┐ ┌──────────────┐     │
│  │  🪟 Windows  │ │  🍎 macOS    │     │
│  │              │ │              │     │
│  │ Instalador   │ │ Intel .dmg   │     │
│  │ 169.1 MB     │ │ Apple Silicon│     │
│  │ [Descargar]  │ │ [Descargar]  │     │
│  └──────────────┘ └──────────────┘     │
│                                         │
│  📋 Requisitos del Sistema              │
│  🔄 Actualizaciones Automáticas         │
│  📞 Soporte                             │
└─────────────────────────────────────────┘
```

**VERIFICAR:**
- [ ] Página carga correctamente
- [ ] Muestra última versión desde GitHub API
- [ ] Muestra opciones para Windows (Installer + Portable)
- [ ] Muestra opciones para macOS (Intel + Apple Silicon)
- [ ] Los tamaños de archivo se muestran correctamente
- [ ] Los enlaces de descarga funcionan
- [ ] El diseño es responsive (móvil y desktop)

---

## 📊 RESULTADOS DE PRUEBAS

| Prueba | Estado | Notas |
|--------|--------|-------|
| 1. Build Vite | ✅ COMPLETADO | Build exitoso en 4.33s |
| 2. Build Completo | ⏳ PENDIENTE | Requiere GH_TOKEN configurado |
| 3. Actualización Automática | ⏳ PENDIENTE | Requiere release publicado |
| 4. Verificación Manual | ⏳ PENDIENTE | Requiere release publicado |
| 5. Descarga e Instalación | ⏳ PENDIENTE | Requiere release publicado |
| 6. Respaldo Base de Datos | ⏳ PENDIENTE | Requiere actualización |
| 7. Página Web | ⏳ PENDIENTE | Requiere deploy a arkhegroup.com |

---

## 🚀 PRÓXIMOS PASOS

### 1. Configurar GitHub (5 minutos)

```bash
# 1. Generar token en:
https://github.com/settings/tokens

# 2. Agregar secret en:
https://github.com/josue958/Arkhe-Aula/settings/secrets/actions

# Nombre: GH_TOKEN
# Valor: ghp_xxxxxxxxxxxx
```

### 2. Habilitar GitHub Actions (2 minutos)

```bash
# Ir a:
https://github.com/josue958/Arkhe-Aula/actions

# Si es la primera vez:
# "I understand my workflows, go ahead and enable them"
```

### 3. Ejecutar Primer Build de Prueba (30 minutos)

```bash
# Ejecutar build
npm run build

# Esperar a que GitHub Actions compile
# Verificar en: https://github.com/josue958/Arkhe-Aula/actions

# Cuando termine (~25 min):
# 1. Ir a Releases
# 2. Revisar release draft
# 3. Publicar release
```

### 4. Ejecutar Plan de Pruebas (15 minutos)

- [ ] Prueba 3: Actualización Automática
- [ ] Prueba 4: Verificación Manual
- [ ] Prueba 5: Descarga e Instalación
- [ ] Prueba 6: Respaldo Base de Datos
- [ ] Prueba 7: Página Web

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### Error: "GH_TOKEN no está configurado"

**Síntoma:** GitHub Actions falla con error de autenticación

**Solución:**
```bash
# 1. Verificar que el secret existe
# Ve a: Settings → Secrets and variables → Actions

# 2. Verificar que el token es válido
# Ve a: https://github.com/settings/tokens

# 3. Si el token expiró, genera uno nuevo y actualiza el secret
```

### Error: "Tag already exists"

**Síntoma:** post-build.js falla al crear el tag

**Solución:**
```bash
# El script automáticamente elimina y recrea el tag
# Si persiste el error, elimina manualmente:
git tag -d v1.12.8
git push origin :refs/tags/v1.12.8

# Luego ejecuta el build nuevamente
npm run build
```

### Error: "Not on main branch"

**Síntoma:** post-build.js salta la publicación automática

**Solución:**
```bash
# Cambiar a rama main
git checkout main
git pull origin main

# Ejecutar build
npm run build
```

### Error: GitHub Actions no se activa

**Síntoma:** El build se completa pero Actions no se ejecuta

**Solución:**
```bash
# Verificar que Actions está habilitado
# Ve a: https://github.com/josue958/Arkhe-Aula/actions

# Verificar que el tag se creó
git tag -l

# Si no hay tag, créalo manualmente
git tag v1.12.8
git push origin v1.12.8
```

---

## 📞 SOPORTE

Si tienes problemas:

1. **Revisa los logs de GitHub Actions:**
   https://github.com/josue958/Arkhe-Aula/actions

2. **Verifica el release:**
   https://github.com/josue958/Arkhe-Aula/releases

3. **Consulta la documentación:**
   - `GITHUB_RELEASE_INSTRUCTIONS.md`
   - `GITHUB_MIGRATION_COMPLETE.md`
   - `AgenteIA/skills/compila.md`

4. **Revisa los errores en la app:**
   - Abre DevTools (F12)
   - Ve a la consola
   - Busca errores de `[Updater]`

---

**¡ÉXITO EN LAS PRUEBAS! 🎉**
