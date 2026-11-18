# Seguridad: decisiones y tareas pendientes

Revisión de las alertas de seguridad de Lovable (18-11-2026).

## Hecho

- **Reseñas**: solo los admins pueden leerlas. El formulario público sigue funcionando, con límites
  (nota 1-5, categoría `restaurant`/`food`/`web`, texto ≤ 2000 caracteres).
  Migración `supabase/migrations/20261118120000_security_reviews_and_tables.sql`.
- **Plano de mesas (`tables`)**: los visitantes sin sesión ya no pueden verlo. Los clientes con sesión
  ven las mesas activas (lo necesita "Mis reservas" para calcular huecos al modificar una reserva).
  Los admins ven todas. Misma migración.
- Corregida la migración antigua `20260509000004_enum_check_constraints.sql`: usaba categorías de
  reseña que no existen (`overall`, `service`…). Si se hubiera aplicado, habría convertido todas las
  reseñas en `overall` y bloqueado el formulario. Nunca llegó a aplicarse en producción.

## Se queda como está (intencionado)

Lectura pública de `site_settings`, `media`, `stores`, `delivery_min_order_tiers`,
`menu_item_store_availability` y `menu_item_ingredients`. Es la carta, los locales, los mínimos de
envío y los interruptores de reservas/pedidos: la web pública los necesita sin iniciar sesión.
Cerrarlos rompería la carta, las reservas y el checkout. En Lovable: marcar como "intencionado".
Escribir en ellas ya está limitado a admins.

## Pendiente (no urgente)

### 1. Listado de fotos del bucket `media` (severidad: Info)

**Qué pasa:** cualquiera puede pedir la lista de nombres de archivo del bucket `media`. Las fotos ya son
públicas (se ven en la web), así que solo se exponen los nombres.

**Si se arregla:** hay que sustituir la regla "Public read access for media" por una solo para admins,
no borrarla sin más, porque el botón de borrar fotos del panel de admin la necesita. Las fotos seguirían
viéndose en la web (el bucket es público).

```sql
DROP POLICY IF EXISTS "Public read access for media" ON storage.objects;
CREATE POLICY "Admins can read media objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'::public.app_role));
```
Después: probar a subir y borrar una foto desde Admin → Media, y comprobar que la carta muestra las imágenes.

### 2. Funciones de la cola de emails (severidad: Warning, no explotable hoy)

**Qué pasa, en sencillo:** cuatro funciones internas que gestionan la cola de emails
(`enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`) se ejecutan con permisos de
"superusuario" y no fijan en qué carpeta de la base de datos buscan las cosas. En teoría, alguien que
pudiera crear objetos en la base de datos podría colarles su propio código.

**Por qué no es urgente:** solo el servidor puede ejecutarlas. Comprobado: un visitante recibe
"permission denied". Es una buena práctica pendiente, no un agujero abierto.

**Riesgo al arreglarlo:** muy bajo, pero si saliera mal dejarían de enviarse emails
(confirmaciones de reserva/pedido, recuperar contraseña). Hay que probarlo justo después.

```sql
ALTER FUNCTION public.enqueue_email(text, jsonb)              SET search_path = pg_catalog, pgmq, public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = pg_catalog, pgmq, public;
ALTER FUNCTION public.delete_email(text, bigint)              SET search_path = pg_catalog, pgmq, public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb)  SET search_path = pg_catalog, pgmq, public;
```
Después: hacer una reserva o pedido de prueba y pedir "recuperar contraseña" para verificar que llegan los emails.
Para deshacerlo: `ALTER FUNCTION ... RESET search_path;`

## Ojo: el repo no refleja exactamente producción

Algunas migraciones del repo no están aplicadas en producción (p. ej. la de categorías de reseñas) y
producción tiene reglas que no están en el repo (p. ej. lectura pública del plano de mesas). Los cambios
de base de datos hay que aplicarlos en producción a mano (editor SQL de Supabase o chat de Lovable), no
basta con subirlos al repo. El resto de `20260509000004_enum_check_constraints.sql` (pedidos, etc.)
tampoco está verificado contra producción.
