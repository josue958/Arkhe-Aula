# Agente Arkhe Aula Web

## Perfil del Sistema

| Parámetro | Valor |
| :--- | :--- |
| **Sistema** | Arkhe Aula Web |
| **Plataforma** | Web (Vue 3 + Vite) |
| **Despliegue** | GitHub Pages / GitHub Repos |
| **Versión** | 1.0.0 |

---

## Objetivo
Este documento sirve como manual central para el AgenteIA encargado de mantener y evolucionar la versión web de Arkhe Aula. A diferencia de la versión de escritorio, esta versión se enfoca en la descarga de software, documentación y servicios de sincronización en la nube.

## Estructura del Proyecto Web

- `/index.html`: Punto de entrada (Landing Page y Descargas).
- `/src/`: Código fuente de la aplicación web.
- `/public/`: Activos estáticos y manifiestos de descarga.
- `/AgenteIA/`: Documentación y skills del agente.

## Skills del Agente

1.  **[Despliegue](AgenteIA/skills/despliegue.md):** Cómo publicar el sitio únicamente en GitHub.
2.  **[Descargas](AgenteIA/skills/descargas.md):** Gestión de la lógica de detección de versiones.
3.  **[Sync](AgenteIA/skills/sync.md):** Integración con servicios de nube (OAuth).

## Flujo de Trabajo
1.  El agente monitorea cambios en el repositorio principal de escritorio.
2.  Cuando hay una nueva versión (`npm run release`), el agente actualiza la landing page web para mostrar los nuevos enlaces.
3.  Publica los cambios mediante `git push origin main`.

---

> [!IMPORTANT]
> **Restricción de Host:** Este sitio NO debe desplegarse en Hostgator. Solo es visible desde GitHub y se mantiene exclusivamente mediante GitHub Pages o el repositorio de GitHub.
