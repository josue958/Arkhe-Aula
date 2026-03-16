# Skill: Despliegue (Web)

## Propósito
Instrucciones para publicar y mantener el sitio Arkhe Aula Web exclusivamente en GitHub.

## Configuración de GitHub Pages

1.  **Repositorio:** El código debe vivir en un repositorio de GitHub (ej: `josue958/ARkhe_aula_WEb`).
2.  **Rama de Publicación:** `main`.
3.  **Configuración:**
    - Ve a Settings -> Pages.
    - Build and deployment -> Source: **Deploy from a branch**.
    - Branch: **main** / Folder: **/(root)**.

## Proceso de Actualización

Para actualizar el sitio web:

```bash
# 1. Realizar cambios en el código
# 2. Add y Commit
git add .
git commit -m "feat: actualización de la landing page"

# 3. Subir a GitHub (El despliegue es automático tras el push)
git push origin main
```

## URL del Sitio
El sitio será accesible en: `https://josue958.github.io/ARkhe_aula_WEb/`

## Restricciones
- **PROHIBIDO:** Usar FTP para subir a Hostgator.
- **PROHIBIDO:** Usar CPanel para este proyecto.
- **MOTIVO:** El usuario desea centralizar la distribución pública únicamente en GitHub para facilitar las descargas sin validaciones de contraseña.
