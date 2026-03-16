# Skill: E-commerce Web

Este skill detalla la implementación del sistema de ventas en el portal de Arkhe Aula.

## Integración de Pagos

### PayPal
- Uso de PayPal JavaScript SDK para botones inteligentes.
- Script cargado en `checkout.html`.
- Modo Sandbox para pruebas y Live para producción.

### Carrito de Compras
- Almacenamiento persistente en `localStorage` o `sessionStorage`.
- Cálculo dinámico de totales e impuestos.

## Seguridad
- Validación de montos tanto en cliente como en servidor.
- Uso de HTTPS obligatorio.
- Prevención de inyección SQL en formularios de contacto/compra (PHP/MySQL).

## Post-Venta
1. Generación de confirmación de compra.
2. Instrucciones de instalación enviadas vía frontend tras el éxito del pago.
