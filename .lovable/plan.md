
## Objetivo

1. Enviar push notifications a usuarios autenticados (reservas + pedidos).
2. Toggle de notificaciones en el perfil del usuario (similar al de admin).
3. Arreglar las etiquetas/estados que muestran "Listo para recoger" en pedidos a domicilio y mostrar el estado correcto según `order_type`.

---

## Parte 1 — Corregir estados según tipo de pedido

Hoy `MyOrders.tsx` usa los mismos estados (`preparing → ready → delivered`) para todos los pedidos. Cambios:

- **Pedidos para recoger (`pickup`)**: `pending → confirmed → preparing → ready (Listo para recoger) → delivered (Recogido)`. Sin "en camino".
- **Pedidos a domicilio (`delivery`)**: `pending → confirmed → preparing → out_for_delivery (En camino) → delivered (Entregado)`. Sin "Listo para recoger".

Acciones:
- Añadir estado `out_for_delivery` en la base de datos (CHECK del campo `status` de `orders`).
- Actualizar `STATUS_LABELS`, `PROGRESS_STEPS` y la lógica de pasos en `MyOrders.tsx` para que dependan de `order.order_type`.
- Actualizar `OrderStatusAnimation.tsx` para mapear `out_for_delivery → driving` y `ready → ready` solo en pickup.
- Actualizar el panel admin (`AdminOrders.tsx`, `IncomingOrderManager.tsx`) para que el botón "Listo" cambie a "En camino" en pedidos delivery, y oculte "Listo para recoger" en delivery.

---

## Parte 2 — Backend de notificaciones a usuarios

### 2.1 RLS / esquema
- `push_subscriptions` ya existe y vale tanto para admins como usuarios (usa `user_id`). No requiere migración salvo verificar políticas (cada user gestiona las suyas).
- Añadir columna en `profiles` (o `user_notification_prefs` tabla nueva) con flags: `notify_reservations boolean default true`, `notify_orders boolean default true`. Migración + RLS (solo el propio user).

### 2.2 Edge function `send-user-push` (nueva)
- Acepta `{ user_id, title, body, url, tag }`.
- Auth: solo service-role (llamada desde triggers/cron).
- Busca subs en `push_subscriptions WHERE user_id = ?`, respeta preferencias del perfil.
- Envía via `web-push` (mismas VAPID keys que admin), limpia subs caducadas.

### 2.3 Notificaciones de pedidos (2-6)
- Modificar trigger `notify_order_status_change` para llamar también a `send-user-push` (o ampliar `notify-order-status` para que dispare push al `user_id` del pedido cuando cambia status).
- Mapear cada nuevo estado al texto correspondiente:
  - `confirmed` → "Pedido confirmado ✅"
  - `preparing` → "Estamos preparando tu pedido 👨‍🍳"
  - `ready` (solo pickup) → "¡Listo para recoger! 🛍️"
  - `out_for_delivery` (solo delivery) → "Tu pedido está en camino 🛵"
  - `delivered` → "¡Pedido entregado! Buon appetito 🍕"
- `url` apunta a `/mis-pedidos` para que al tocar la notificación se abra la animación de estado correspondiente.

### 2.4 Recordatorio de reserva (1) — 30 min antes
- Edge function programada `reservation-reminder-cron` (pg_cron cada 5 min).
- Selecciona reservas `status='confirmed'` cuya `reservation_date + reservation_time` esté entre `now()+25min` y `now()+30min` y que no tengan flag `reminder_sent_at`.
- Llama `send-user-push` al `user_id` (si tiene) y marca `reminder_sent_at = now()` (nueva columna en `reservations`).
- Mensaje: "Recordatorio: ¡Nos vemos en 30 minutos! 🍕".

---

## Parte 3 — UI en /perfil

- Nueva sección "Notificaciones" en `Profile.tsx` con:
  - Componente reutilizable `UserPushNotificationToggle` (basado en el de admin pero sin requerir rol).
  - Dos switches: "Recordatorios de reservas" y "Estado de mis pedidos" (guardan flags del perfil).
  - Botón "Enviar prueba" (llama a `send-user-push` con el propio `user_id`).

---

## Archivos a tocar / crear

**Frontend**
- `src/pages/MyOrders.tsx` — pasos y etiquetas según `order_type`.
- `src/components/OrderStatusAnimation.tsx` — soportar `out_for_delivery`.
- `src/pages/AdminOrders.tsx`, `src/components/IncomingOrderManager.tsx` — botones de transición de estado por tipo.
- `src/pages/Profile.tsx` — sección notificaciones.
- `src/components/UserPushNotificationToggle.tsx` *(nuevo)*.
- `src/hooks/usePushSubscription.ts` — ya sirve, sin cambios.

**Backend**
- Migración: añadir `out_for_delivery` al CHECK de `orders.status`; columnas `notify_reservations`, `notify_orders` en `profiles`; columna `reminder_sent_at` en `reservations`; cron job de recordatorios.
- `supabase/functions/send-user-push/index.ts` *(nueva)*.
- `supabase/functions/notify-order-status/index.ts` — disparar push al user al cambiar status.
- `supabase/functions/reservation-reminder-cron/index.ts` *(nueva)*.

---

## Orden de implementación

1. Migración (estados + flags + reminder_sent_at).
2. Fix UI de estados en MyOrders + animación + admin.
3. Edge function `send-user-push` + integración en `notify-order-status`.
4. Edge function + cron de recordatorios.
5. Sección notificaciones en Profile + toggle.
6. Probar push de prueba y un cambio de estado real.

¿Apruebas el plan para empezar?
