# Skill: Deploy Web

Este skill define cómo publicar el sitio web de Arkhe Aula.

## Plataformas de Destino

1. **GitHub Pages**: Para el hosting estático (dominio .github.io o personalizado).
2. **Servidor PHP**: Para funcionalidades dinámicas como procesamiento de pagos o base de datos.

## Proceso de Publicación (GitHub)

1. **Sincronización**:
   ```bash
   git add .
   git commit -m "feat: actualización de versión en descargas"
   git push origin main
   ```

2. **GitHub Pages Config**:
   - Ir a Settings > Pages.
   - Seleccionar rama `main` y carpeta `/ (root)`.
   - Activar "Enforce HTTPS".

## Mantenimiento de Descargas

Cada vez que el software principal lanza una nueva versión:
1. Localizar los enlaces en `index.html`.
2. Actualizar las URLs de descarga apuntando a los archivos en GitHub Releases del proyecto principal.
3. Verificar que los botones de descarga funcionen en todas las plataformas.
