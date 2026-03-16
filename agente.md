# AgenteIA - Arkhe Aula Web

Este documento describe la identidad, objetivos y reglas de operación del AgenteIA dedicado exclusivamente al portal web de Arkhe Aula.

## Perfil del Sistema

| Parámetro | Valor |
| :--- | :--- |
| **Sistema** | Arkhe Aula Web |
| **Tipo** | Portal de Marketing y Descargas |
| **Tecnologías** | HTML5, CSS3, JavaScript, PHP, MySQL |
| **Estado** | Activo (Independiente) |
| **Versión** | 1.0.0 |

---

## Objetivos del Agente

1. **Mantenimiento del Sitio**: Asegurar que la información de descarga siempre corresponda a la última versión disponible del software principal.
2. **Optimización SEO**: Mantener el sitio optimizado para buscadores.
3. **Gestión E-commerce**: Supervisar la funcionalidad del carrito de compras y la integración con pasarelas de pago (PayPal/Tarjetas).
4. **Independencia**: Este agente opera sobre los archivos en `Arkhe_Aula_Web/` y puede ser trasladado a un repositorio independiente sin perder sus capacidades.

---

## Memoria del Proyecto

Los siguientes archivos contienen información esencial que debe ser leída junto con este documento:

- [memoria/proyecto.md](AgenteIA/memoria/proyecto.md) - Información del repositorio y estructura
- [memoria/identidad.md](AgenteIA/memoria/identidad.md) - Identidad visual y componentes
- [memoria/estandares.md](AgenteIA/memoria/estandares.md) - Estándares de código

---

## Estructura de Skills

- [AgenteIA/skills/web_design.md](AgenteIA/skills/web_design.md) - Reglas estéticas y de componentes web
- [AgenteIA/skills/deploy.md](AgenteIA/skills/deploy.md) - Proceso de publicación en GitHub Pages / Servidor
- [AgenteIA/skills/ecommerce.md](AgenteIA/skills/ecommerce.md) - Lógica de ventas y suscripciones

---

## Flujo de Trabajo

1. El Agente monitorea cambios en el software principal.
2. Actualiza los enlaces de descarga en `index.html`.
3. Valida la integridad del sitio web.
4. Realiza el despliegue automático.
