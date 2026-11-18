# Plan: Disponibilidad por local + nuevo flujo de pedido

## TL;DR del estado actual

Hallazgos críticos antes de empezar:

1. **No existe tabla `stores`/`locations` en la BD.** Los locales están hardcodeados en `src/lib/locations.ts`, `src/lib/storeHours.ts` y `src/lib/nearestStore.ts`. Solo `tarragona` y `arrabassada` participan en pedidos; `rincon` está silenciosamente excluido. No hay flags `accepts_delivery` / `accepts_pickup`.
2. **El menú público (`MenuSection.tsx`) NO lee de `menu_items`.** Usa un array hardcodeado en TS. La tabla `menu_items` existe y la gestiona `AdminProducts`, pero los dos están desconectados. Esto es un bloqueador para cualquier filtrado dinámico por local.
3. **El botón "Hacer un pedido" del Hero hoy solo funciona para admins** (badge "Próximamente" para el resto).
4. **No hay relación ingredientes ↔ pizzas en la BD.** `inventory_items` es un sistema de stock totalmente independiente de `menu_items`, sin FK ni tabla puente. Hoy es imposible responder "¿qué pizzas usan este ingrediente?".
5. **El `CartContext` no conoce ni local ni tipo de pedido.** Esa decisión se toma en `/checkout` al enviar, vía `getNearestStore()`.
6. **Selección pickup/delivery y dirección viven dentro de `/checkout`** (`AddressAutocomplete` + campos `streetNumber`/`staircase`/`floor`/`door`).

---

## Casuística 1 — Locales

**Existe**: slugs `tarragona`, `arrabassada`, `rincon` usados como strings sueltos en columnas (`orders.pickup_store`, `orders.assigned_to`, `tables.location`, `inventory_stock.store`, `delivery_min_order_tiers.store`, `inventory_items.stores[]`).

**A crear**: tabla `stores` como única fuente de verdad.

```sql
stores (
  slug text PK,                -- 'tarragona' | 'arrabassada' | 'rincon'
  name text,
  accepts_delivery boolean,
  accepts_pickup boolean,
  is_active boolean,
  sort_order int
)
```

Seed: tarragona y arrabassada con ambos flags true; rincon con ambos false.

**A modificar**: `src/lib/locations.ts` puede seguir teniendo metadatos de marketing (mapa, fotos, SEO), pero los flags de pedido se leen de `stores`. `storeHours.ts` y `nearestStore.ts` filtran candidatos por `accepts_delivery`/`accepts_pickup`.

**Riesgo**: muchas columnas string sin FK. No las migramos a FK ahora (riesgo alto, fuera de scope) — solo añadimos la tabla `stores` como referencia y la consultamos.

---

## Casuística 2 — Nuevo flujo de entrada

**Existe**: `HeroSection` con dos CTAs ("Reservar Mesa", "Hacer un pedido" gated a admin). `MenuSection` renderiza siempre por debajo. La dirección y el tipo de pedido viven en `/checkout`.

**A crear**:
- `OrderModeGate` (componente top-level en `/` o página dedicada `/local`): mientras el usuario no elija "Reservar" o "Pedir", se bloquea el scroll (`overflow:hidden` en body + overlay). Persistir elección en `sessionStorage` para no re-pedirla.
- `OrderTypeDialog`: el botón "Hacer un pedido" abre diálogo con dos opciones:
  - **Recoger**: lista de locales con `accepts_pickup=true`, badge "Abierto" / "Cerrado · Programar pedido" según `storeHours.ts`. Si está cerrado, selector de hora limitado al horario del día siguiente.
  - **Domicilio**: `AddressAutocomplete` (extraído de Checkout a un componente reutilizable) + `getNearestStore()`. Asigna local antes de mostrar el menú.
- Nuevo estado en `CartContext` (o nuevo `OrderFlowContext`): `{ mode: 'reserve' | 'order' | null, orderType: 'pickup'|'delivery'|null, storeSlug, address?, scheduledFor? }`. Persistido en sessionStorage.

**A modificar**:
- `HeroSection`: desbloquear el botón "Hacer un pedido" para todos.
- `Index.tsx`: envolver con el gate.
- `Checkout.tsx`: dejar de pedir tipo, dirección y local (vienen del contexto). Solo confirmación + pago. Mantiene fallback si alguien llega directo.
- `MenuSection`: lee `showAddButton` del contexto (`mode === 'order'`), no de `isAdmin`.

**Riesgo**: bloqueo de scroll en home puede afectar SEO. Mitigación: el gate solo se activa en la entrada al flujo de pedido/local, no en landing. Definir si la home pública conserva scroll libre (recomendado) y el gate vive en `/local` o se activa al pulsar "Hacer un pedido".

---

## Casuística 3 — Menú filtrado por local

**Existe**: `MenuSection.tsx` renderiza array hardcodeado. `AdminProducts` gestiona `menu_items` pero ese cambio no llega al público.

**Bloqueador**: hay que **migrar `MenuSection` a leer de `menu_items`** antes de poder filtrar por local. Mientras los productos sean hardcodeados, no hay forma de mapearlos a una disponibilidad por local en BD.

**A crear**:
- Nueva tabla `menu_item_store_availability`:

```sql
menu_item_store_availability (
  id uuid PK,
  menu_item_id uuid FK menu_items(id) ON DELETE CASCADE,
  store_slug text FK stores(slug),
  is_available boolean default true,
  unavailable_until timestamptz null,     -- null = indefinido; valor = reactiva auto
  updated_at timestamptz,
  UNIQUE(menu_item_id, store_slug)
)
```

Por defecto, si no hay fila → disponible. Cron edge function (o `unavailable_until <= now()` evaluado en lectura) reactiva.

**A modificar**:
- `MenuSection`: fetch a `menu_items` join `menu_item_store_availability` por `storeSlug` del contexto. Renderiza no disponibles con opacidad + badge "No disponible hoy" + sin botón carrito.
- Sembrar `menu_items` con los productos hoy hardcodeados (migración de datos) — paso obligatorio.

**Riesgo**: el seed debe respetar `reference_key` que ya usa `useMedia("menu_item")` para imágenes. Verificar que el `name` que se inserta en BD coincide con los nombres usados en `media.reference_key`.

---

## Casuística 4 — Disponibilidad por local en admin

**Existe**: `AdminProducts.tsx` con switch global `is_active`. No hay per-store.

**A crear / modificar en `AdminProducts`**:
- Por cada producto, mostrar N toggles (uno por cada `store` con `accepts_delivery OR accepts_pickup`).
- Click en toggle OFF → diálogo:
  - **"Hasta mañana"** → escribe `unavailable_until = mañana a la hora de apertura del local` (deriva de `storeHours.ts` / nueva tabla `stores`).
  - **"Desactivar temporalmente"** → `unavailable_until = null`, `is_available = false`.
- Toggle ON → upsert `is_available=true`, `unavailable_until=null`.
- Indicador visual: si `unavailable_until` está en el futuro, muestra "Vuelve a las HH:MM".

**Lectura en runtime**: producto considerado disponible si `is_available=true` OR `unavailable_until <= now()`. Una edge function nocturna puede limpiar filas vencidas (opcional, no bloqueante).

---

## Casuística 5 — Desactivación en cascada por ingrediente

**Existe**: `AdminInventory` gestiona `inventory_items`. No hay vínculo con `menu_items`. No hay modal en cascada.

**Bloqueador**: sin tabla puente ingredientes ↔ pizzas no podemos calcular "qué pizzas usan ingrediente X".

**A crear**:

```sql
menu_item_ingredients (
  id uuid PK,
  menu_item_id uuid FK menu_items(id) ON DELETE CASCADE,
  inventory_item_id uuid FK inventory_items(id) ON DELETE CASCADE,
  UNIQUE(menu_item_id, inventory_item_id)
)
```

Más una UI mínima en `AdminProducts` (o en `AdminInventory`) para vincular ingredientes a productos. Sin esto el "cascade" está vacío.

**A modificar** en `AdminInventory`:
- Al desactivar un `inventory_item` (toggle global o por store), antes de guardar abrir `IngredientCascadeDialog`:
  - Lista paginada (6/pág) de `menu_items` que contienen ese ingrediente
  - Por cada pizza: toggles por local
  - Checkbox global "Desactivar todas"
  - Botón "Confirmar" → batch upsert en `menu_item_store_availability`
  - Botón "Solo desactivar el ingrediente" → cierra modal sin tocar productos

**Riesgo / esfuerzo extra**: poblar `menu_item_ingredients` para las pizzas existentes es trabajo manual del admin. Sin ese seed la cascada no aporta nada.

---

## Esquema BD propuesto (resumen)

```text
stores                            ← NUEVA, fuente de verdad de locales
  slug, name, accepts_delivery, accepts_pickup, is_active, sort_order

menu_item_store_availability      ← NUEVA, disponibilidad por local
  menu_item_id, store_slug, is_available, unavailable_until

menu_item_ingredients             ← NUEVA, puente pizzas↔ingredientes
  menu_item_id, inventory_item_id
```

Más:
- Seed de `menu_items` con todos los productos hoy hardcodeados en `MenuSection.tsx`.
- Seed de `stores` con tarragona/arrabassada (delivery+pickup) y rincon (ambos false).
- GRANTs y RLS (lectura pública en `stores` y `menu_item_store_availability`; escritura admin).

---

## Orden de implementación recomendado

1. **Tabla `stores` + seed** (desbloquea filtrar locales por capacidad).
2. **Migrar `MenuSection` a leer de `menu_items`** + seed de productos (bloqueador de casuísticas 3 y 4).
3. **Tabla `menu_item_store_availability`** + lectura en `MenuSection` + UI en `AdminProducts` (casuística 4).
4. **Contexto de flujo de pedido** + `OrderModeGate` + `OrderTypeDialog` + extracción del `AddressAutocomplete` (casuística 2). Adaptar `Checkout` para consumir contexto.
5. **Filtrado visual del menú por local** ya consumiendo el contexto (casuística 3 cierre).
6. **Tabla `menu_item_ingredients`** + UI de vinculación + `IngredientCascadeDialog` (casuística 5).

## Riesgos transversales

- **Doble fuente de verdad de menú** mientras dure la migración del paso 2: hay que retirar el array hardcodeado en el mismo PR que active el fetch, sin coexistencia.
- **`reference_key` de `media`** debe seguir matcheando tras el seed o se rompen imágenes.
- **Scroll lock** del gate debe respetar accesibilidad (focus trap, escape, SEO de la home).
- **`rincon`** queda explícitamente como "solo presencial" en `stores`; cualquier código que itere stores ahora debe filtrar por `accepts_delivery`/`accepts_pickup` en vez de hardcodear la lista.
- **Sin seed manual de `menu_item_ingredients`** la cascada (5) no surte efecto. Conviene anticipar al admin el coste de poblar esa relación.
