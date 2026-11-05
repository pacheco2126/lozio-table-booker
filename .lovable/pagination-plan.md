# Carga completa de reseñas y pedidos

- Cargar las reseñas en tandas para que estadísticas y filtros incluyan todos los registros.
- Aplicar la misma gestión a los pedidos por local, el historial del cliente y la cola de pedidos pendientes, tanto recogida como domicilio.
- Revisar los artículos de cada pedido y las consultas de las funciones de pedidos para evitar listas incompletas.
- Mantener los filtros, permisos, estados y presentación actuales, sin cambiar el límite del servidor.
- Añadir pruebas con más de 1.000 registros y comprobar las pantallas disponibles.

## Detalles técnicos

Usar un helper de paginación con `.range()` y orden estable, que no publique resultados parciales si falla una tanda. Revisar las relaciones `order_items` y paginarlas independientemente cuando sea necesario. Los productos del catálogo están en `menu_items`; las líneas compradas están en `order_items`.