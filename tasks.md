# TASKS — Disponibilidad por local y nuevo flujo de pedido

Cada tarea es independiente y debe implementarse en orden. No implementes la siguiente hasta que la anterior esté confirmada.

---

## TASK 1 — Migración BD: añadir `free_extras` a `menu_items`

### Contexto
`MenuSection.tsx` tiene datos del menú hardcodeados. Algunos items tienen `freeExtras: number` (ej: "CREA TU PIZZA" tiene 4 extras gratis incluidos en el precio). Cuando migremos el menú a datos dinámicos de Supabase, necesitamos guardar este valor en BD.

### Qué hacer
Crea una nueva migración SQL en `supabase/migrations/` con nombre que empiece por la fecha actual.

Contenido de la migración:

```sql
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS free_extras integer NOT NULL DEFAULT 0;
```

Nada más. No toques ningún otro archivo todavía.

### Criterio de aceptación
- El campo `free_extras` existe en la tabla `menu_items` de Supabase
- El tipo generado en `src/integrations/supabase/types.ts` se actualiza para incluir `free_extras: number`

---

## TASK 2 — Crear `OrderIntentContext`

### Contexto
Actualmente el tipo de pedido (pickup/delivery) y los datos de dirección viven en el formulario de `Checkout.tsx`. Necesitamos moverlos a un contexto global para que el menú sepa qué local mostrar ANTES de llegar al checkout.

El `CartContext` en `src/contexts/CartContext.tsx` ya existe y no lo toques. Este es un contexto NUEVO independiente.

### Qué hacer
Crea el archivo `src/contexts/OrderIntentContext.tsx` con esta interfaz exacta:

```typescript
export type OrderType = 'pickup' | 'delivery' | 'dine-in' | null;

export interface DeliveryAddress {
  address: string;       // calle
  streetNumber: string;  // número
  city: string;
  postalCode: string;
  staircase?: string;
  floor?: string;
  door?: string;
}

export interface OrderIntent {
  orderType: OrderType;
  storeSlug: string | null;      // 'tarragona' | 'arrabassada' | null
  deliveryAddress: DeliveryAddress | null;
}
```

El contexto debe:
- Persistir en `localStorage` con clave `lozio_order_intent`
- Exportar el hook `useOrderIntent()`
- Exportar estas funciones:
  - `setPickup(storeSlug: string)` → guarda `{ orderType: 'pickup', storeSlug, deliveryAddress: null }`
  - `setDelivery(address: DeliveryAddress, storeSlug: string)` → guarda `{ orderType: 'delivery', storeSlug, deliveryAddress: address }`
  - `setDineIn()` → guarda `{ orderType: 'dine-in', storeSlug: null, deliveryAddress: null }`
  - `clearIntent()` → limpia todo y borra localStorage

Añade `<OrderIntentProvider>` en `src/App.tsx` envolviendo toda la app, igual que está `<CartProvider>`.

### Criterio de aceptación
- El hook `useOrderIntent()` devuelve `{ intent, setPickup, setDelivery, setDineIn, clearIntent }`
- Si recargo la página, el estado persiste desde localStorage
- No rompe nada del flujo existente

---

## TASK 3 — Modal de intención al entrar al local

### Contexto
Cuando el usuario llega a `/locales/:slug` (componente `LocationDetail.tsx`), actualmente puede hacer scroll libremente y ver la info del local. Queremos bloquear esto con un modal de selección que aparezca encima de todo hasta que el usuario elija.

### Qué hacer
En `LocationDetail.tsx`, añade lógica para mostrar un overlay modal a pantalla completa **si `intent.orderType` es `null`** (el usuario no ha elegido todavía). Si ya tiene una intención guardada, no lo muestres (salvo que llame a `clearIntent`).

El modal debe:
- Cubrir toda la pantalla con fondo semitransparente oscuro
- **Bloquear el scroll** del contenido detrás (`overflow: hidden` en body)
- Mostrar en el centro dos botones grandes (estilo tarjeta):

**Botón A — "Reservar una mesa"**
- Icono de mesa/calendario
- Subtexto: "Sin consumo mínimo"
- Al pulsar: llama a `setDineIn()` y cierra el modal

**Botón B — "Hacer un pedido"**
- Icono de bolsa/caja
- Subtexto: "Recoge o recibe en casa"
- Al pulsar: no cierra este modal todavía, abre el `OrderTypeDialog` (TASK 4)

El modal NO tiene botón de cerrar (el usuario DEBE elegir).

No crees el `OrderTypeDialog` aquí todavía — solo añade el estado `orderTypeDialogOpen` y pásalo como prop o usa el sub-componente vacío como placeholder.

### Criterio de aceptación
- El modal aparece al entrar en `/locales/:slug` si no hay intención guardada
- El scroll del fondo está bloqueado
- Al pulsar "Reservar una mesa" el modal desaparece y la página es navegable
- Al pulsar "Hacer un pedido" se podría abrir el siguiente diálogo (aunque de momento puede ser un toast de "próximamente")

---

## TASK 4 — Diálogo de tipo de pedido: Recoger / Domicilio

### Contexto
Este diálogo se abre cuando el usuario pulsa "Hacer un pedido" en el modal del TASK 3. El usuario debe elegir entre recoger en local o domicilio. Actualmente estas opciones están en `Checkout.tsx` — no las elimines de allí todavía, mantén ambos flujos durante la migración.

### Qué hacer
Crea el componente `src/components/OrderTypeDialog.tsx`. Es un `Dialog` (usa el componente `Dialog` de `src/components/ui/dialog.tsx`) con dos pasos internos:

---

**PASO 1 — Elegir tipo**

Dos opciones en tarjeta:

**Opción A — "Recoger en el local"**
- Al pulsar: va al PASO 2A

**Opción B — "Pedir a domicilio"**
- Al pulsar: va al PASO 2B

---

**PASO 2A — Seleccionar local para recogida**

Muestra los locales de Supabase donde `accepts_pickup = true` (tarragona y arrabassada).

Para cada local:
- Muestra nombre y dirección (obtenidos de `src/lib/locations.ts`)
- Muestra estado **Abierto / Cerrado** usando `isStoreOpen(storeSlug, new Date())` de `src/lib/storeHours.ts`
- Si está **cerrado**: muestra un badge naranja "Programar pedido" debajo del nombre. El local sigue siendo seleccionable.
- Si está **abierto**: muestra badge verde "Abierto"

Al seleccionar un local:
- Llama a `setPickup(storeSlug)`
- Cierra el dialog
- Cierra el modal de TASK 3

---

**PASO 2B — Introducir dirección para domicilio**

Muestra el componente `AddressAutocomplete` que actualmente vive en `src/components/AddressAutocomplete.tsx`. No lo muevas todavía de Checkout.tsx, simplemente impórtalo aquí también.

Campos adicionales que aparecen al rellenar la dirección:
- Número (obligatorio si no viene en la dirección autocomplete)
- Escalera (opcional)
- Piso (opcional)  
- Puerta (opcional)

Lógica de asignación automática de local:
- Si el código postal empieza por `43` → local más cercano basado en el código postal
- Regla simple: usa `tarragona` como default para todos los códigos postales de Tarragona. No hace falta geocodificación avanzada ahora — el refinamiento vendrá después.
- (Nota: en el futuro esto calculará distancia a cada local, por ahora asigna siempre `tarragona` si es zona 43)

Al confirmar la dirección:
- Llama a `setDelivery(addressData, 'tarragona')`
- Cierra el dialog y el modal de TASK 3

El dialog tiene botón "Atrás" en los pasos 2A y 2B para volver al PASO 1.

### Criterio de aceptación
- El flujo completo funciona: Local page → Modal → "Hacer un pedido" → Dialog Paso 1 → elegir tipo → completar datos → `OrderIntentContext` actualizado
- El modal del TASK 3 se cierra al finalizar
- El intent queda guardado en localStorage
- Si vuelvo a entrar en la página del local (sin limpiar), el modal NO aparece

---

## TASK 5 — Migrar MenuSection.tsx a datos dinámicos de Supabase

### Contexto
`src/components/MenuSection.tsx` tiene todos los productos del menú hardcodeados como un array en el propio componente (unas 150 líneas de datos). La tabla `menu_items` en Supabase ya tiene estos productos. La tabla `menu_item_store_availability` ya tiene la disponibilidad por local.

### Qué hacer
Reemplaza los datos hardcodeados por una query a Supabase.

**Query principal:**
```typescript
const { data: menuItems } = await supabase
  .from('menu_items')
  .select(`
    *,
    menu_item_store_availability (
      store_slug,
      is_available,
      unavailable_until
    )
  `)
  .eq('is_active', true)
  .order('sort_order');
```

**Lógica de disponibilidad por producto:**

Lee el `storeSlug` desde `useOrderIntent()`. Para cada producto:
1. Busca en `menu_item_store_availability` la fila donde `store_slug === storeSlug`
2. Si no hay fila → el producto **está disponible** (ausencia = disponible)
3. Si hay fila y `is_available = true` → disponible
4. Si hay fila y `is_available = false`:
   - Si `unavailable_until` es null → **No disponible** (indefinido)
   - Si `unavailable_until` es una fecha futura → **No disponible** (temporal)
   - Si `unavailable_until` es una fecha pasada → tratar como **disponible** (ya expiró)

**Visualización de productos NO disponibles:**
- Opacidad reducida: `opacity-40` en toda la tarjeta
- Badge encima de la imagen: `"No disponible hoy"` en rojo/gris
- Sin botón "Añadir al carrito" (ocultarlo, no deshabilitarlo)
- El producto SIEMPRE se muestra (nunca oculto)

**Modo lectura (cuando `orderType === 'dine-in'`):**
- Ocultar el botón "Añadir al carrito" para TODOS los productos (disponibles o no)
- El badge "No disponible hoy" puede seguir mostrándose en dine-in si aplica

**`freeExtras`:**
- Usar `item.free_extras` (nuevo campo de TASK 1) en lugar del hardcodeado

Mantén las categorías: pizzas, focaccias, calzones, extras, drinks, desserts.

### Criterio de aceptación
- Los productos se cargan de Supabase
- Los productos no disponibles para el local elegido se muestran con opacidad y sin carrito
- Los productos disponibles tienen el botón de carrito normal
- En modo dine-in no hay botones de carrito
- `freeExtras` funciona desde el campo de BD

---

## TASK 6 — Ocultar carrito en modo dine-in

### Contexto
Cuando `orderType === 'dine-in'`, el usuario solo puede ver el menú, no hacer pedidos. Hay varios componentes del carrito que deben ocultarse en este modo.

### Qué hacer
Lee `useOrderIntent()` en estos componentes y oculta los elementos cuando `intent.orderType === 'dine-in'`:

- `src/components/CartFloatingButton.tsx` → ocultar completamente
- `src/components/CartSidebar.tsx` → no abrir si se intenta acceder en dine-in
- `src/components/CartDrawer.tsx` → no abrir en dine-in
- `src/components/Navbar.tsx` → ocultar el icono del carrito si existe

No elimines lógica del carrito, solo añade condiciones de renderizado.

### Criterio de aceptación
- En modo dine-in el usuario no puede abrir el carrito
- En modo pickup/delivery el carrito funciona igual que antes

---

## TASK 7 — Toggles de disponibilidad por local en AdminProducts

### Contexto
`src/components/AdminProducts.tsx` tiene un toggle global `is_active` por producto (activa/desactiva en todos los locales a la vez). Necesitamos añadir toggles **por local** que controlen `menu_item_store_availability`.

Los locales que aceptan pedidos son: `tarragona` y `arrabassada` (los que tienen `accepts_pickup = true` o `accepts_delivery = true` en la tabla `stores`). `rincon` no acepta pedidos, así que no necesita toggles de disponibilidad.

### Qué hacer
En `AdminProducts.tsx`, para cada producto en el listado:

**1. Carga de disponibilidad:**
Query a `menu_item_store_availability` para todos los productos mostrados, filtrando por `store_slug IN ('tarragona', 'arrabassada')`. Haz la query una sola vez para todos los productos (no una por producto).

**2. UI — añadir columna de disponibilidad:**
Para cada producto, muestra dos toggles pequeños side-by-side:
- Toggle "TGN" (Tarragona)
- Toggle "ARR" (Arrabassada)

El toggle muestra:
- **Verde / ON** → disponible (sin fila en BD o `is_available = true` y sin fecha activa)
- **Rojo / OFF** → no disponible
- Si `unavailable_until` no es null (y es fecha futura), muestra debajo del toggle el tiempo restante formateado: "hasta las 19:00" o "hasta mañana 19:00"

**3. Al desactivar un toggle (pasar de ON a OFF):**
No guardes directamente. Abre un `AlertDialog` (usa `src/components/ui/alert-dialog.tsx`) con:

> **¿Hasta cuándo no estará disponible?**
> 
> [Hasta mañana] — Se reactiva automáticamente a las 19:00 de mañana  
> [Desactivar indefinidamente] — Queda desactivado hasta que lo reactive manualmente

- **"Hasta mañana"**: llama a la función `getNextOpeningTime(storeSlug)` de `src/lib/storeHours.ts` para calcular la próxima apertura. Guarda: `{ is_available: false, unavailable_until: nextOpeningTime }`
- **"Desactivar indefinidamente"**: guarda: `{ is_available: false, unavailable_until: null }`

Si no existe fila en `menu_item_store_availability` para ese producto+local, haz un `INSERT`. Si ya existe, haz un `UPDATE`.

**4. Al activar un toggle (pasar de OFF a ON):**
Sin diálogo. Guarda directamente: `{ is_available: true, unavailable_until: null }`.

Añade a `src/lib/storeHours.ts` la función `getNextOpeningTime(storeSlug: string): Date` que devuelve el timestamp de la próxima apertura del local (mañana a la hora de apertura). Usa la lógica ya existente en `storeHours.ts`.

### Criterio de aceptación
- Cada producto muestra dos toggles (TGN / ARR)
- Al desactivar, aparece el diálogo de confirmación con las dos opciones
- Los cambios se guardan en `menu_item_store_availability`
- El indicador de tiempo restante se muestra cuando aplica
- Al activar, se limpia `unavailable_until` y el indicador desaparece

---

## TASK 8 — Modal de cascada al desactivar ingrediente

### Contexto
`src/components/AdminInventory.tsx` tiene un toggle de `is_active` por ingrediente de inventario. Actualmente al desactivarlo se guarda directamente. Necesitamos interceptar esa acción y mostrar primero un modal con las pizzas afectadas.

La tabla `menu_item_ingredients` (ya existe) relaciona `inventory_item_id` con `menu_item_id`.

### Qué hacer
En `AdminInventory.tsx`, cuando el admin intenta desactivar un ingrediente (toggle `is_active` de ON a OFF):

**Paso 1 — Interceptar y buscar pizzas afectadas:**
Antes de guardar, query:
```typescript
const { data: affectedItems } = await supabase
  .from('menu_item_ingredients')
  .select(`
    menu_item_id,
    menu_items (
      id,
      name,
      category
    )
  `)
  .eq('inventory_item_id', ingredientId);
```

Si no hay pizzas afectadas (array vacío): desactiva el ingrediente directamente sin modal.

Si hay pizzas afectadas: abre el modal de cascada.

**Paso 2 — Modal de cascada:**
Crea el componente `src/components/IngredientDeactivateCascadeDialog.tsx`.

Contenido del modal:

> **El ingrediente "[nombre]" se usa en estas pizzas**  
> ¿Quieres desactivarlas también en algún local?

Lista de pizzas afectadas (paginada: 6 por página, con paginador si hay más):

Para cada pizza:
- Nombre de la pizza
- Toggle "TGN" y toggle "ARR" (por defecto: ambos ON = se van a desactivar)
- El admin puede desmarcar alguno si no quiere desactivar en ese local

Encima de la lista: checkbox **"Desactivar en todos los locales"** — al marcarlo, activa todos los toggles de todas las pizzas. Al desmarcarlo, desactiva todos.

Estado inicial del modal: todos los toggles activados (por defecto se desactivan todas).

**Botones del modal:**
- **"Confirmar"**: 
  1. Desactiva el ingrediente: `UPDATE inventory_items SET is_active = false WHERE id = ingredientId`
  2. Para cada pizza que tenga al menos un toggle activo, hace upsert en `menu_item_store_availability`:
     - Si toggle TGN activo: `{ menu_item_id, store_slug: 'tarragona', is_available: false, unavailable_until: null }`
     - Si toggle ARR activo: `{ menu_item_id, store_slug: 'arrabassada', is_available: false, unavailable_until: null }`
  3. Cierra el modal y muestra toast de éxito

- **"Solo desactivar el ingrediente"**:
  1. Solo desactiva el ingrediente: `UPDATE inventory_items SET is_active = false WHERE id = ingredientId`
  2. No toca `menu_item_store_availability`
  3. Cierra el modal

El modal tiene un botón X para cancelar (no desactiva nada).

### Criterio de aceptación
- Al desactivar un ingrediente, si tiene pizzas asociadas, aparece el modal
- La lista de pizzas está paginada (máx 6 por página)
- El checkbox global funciona (marca/desmarca todos)
- "Confirmar" actualiza ingrediente y disponibilidad de pizzas seleccionadas
- "Solo desactivar el ingrediente" no toca las pizzas
- Cancelar (X) no guarda nada

---

## Orden de implementación

```
TASK 1 → TASK 2 → TASK 3 → TASK 4 → TASK 5 → TASK 6 → TASK 7 → TASK 8
```

Las TASK 1-6 son el nuevo flujo de usuario (casuísticas 1-3).  
Las TASK 7-8 son el panel admin (casuísticas 4-5).  
Cada tarea debe estar funcionando antes de pasar a la siguiente.
