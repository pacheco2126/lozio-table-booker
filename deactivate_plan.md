Antes de implementar nada, necesito que revises la estructura actual del proyecto y tomes decisiones de implementación. No toques ningún archivo todavía. Solo analiza y responde con tu plan.

---

## CONTEXTO: QUÉ QUEREMOS CONSTRUIR

Queremos implementar un sistema de gestión de disponibilidad de productos por local, y reestructurar el flujo con el que el usuario hace un pedido. A continuación te explico todas las casuísticas. Luego quiero que revises el código y la base de datos actual y me digas cómo lo implementarías encajando con lo que ya existe.

---

## CASUÍSTICA 1 — LOCALES

Tenemos (o queremos tener) estos locales:
- Pizzeria Tarragona → acepta domicilio y recogida
- Pizzeria Arrabassada → acepta domicilio y recogida
- El Rincon → no acepta domicilio ni recogida (solo presencial)

**Pregunta para ti:** ¿Existe ya una tabla o estructura de locales en Supabase? ¿Cómo se llama y qué campos tiene? ¿Hay algún campo que indique si un local acepta pedidos o no?

---

## CASUÍSTICA 2 — NUEVO FLUJO DE USUARIO AL ENTRAR AL LOCAL

Cuando el usuario entra en la página del local, queremos mostrarle SOLO dos botones, sin poder hacer scroll hasta que elija:

**Botón A — "Reservar una mesa"**
- Hace lo que hace actualmente el flujo de reservas
- El menú se muestra en modo lectura (sin botón de añadir al carrito)

**Botón B — "Hacer un pedido"**
Abre un diálogo con dos opciones:

  → **B1 — "Recoger en el local"**
  Muestra los locales disponibles para recogida. Cada local indica si está 
  abierto o cerrado según su horario. Si está cerrado, aparece un badge 
  "Programar pedido" y solo se puede seleccionar hora del día siguiente 
  dentro del horario del local.

  → **B2 — "Pedir a domicilio"**
  Se pide la dirección al usuario (actualmente este input existe en el carrito, 
  queremos moverlo aquí). Con la dirección, el sistema asigna automáticamente 
  el local más cercano. A partir de ese momento el sistema sabe qué local 
  gestionará el pedido.

**Pregunta para ti:** ¿Cómo está implementado actualmente el flujo de entrada al local? ¿Hay algún componente de selección de tipo de pedido? ¿Dónde vive actualmente el input de dirección para domicilio?

---

## CASUÍSTICA 3 — MENÚ FILTRADO POR LOCAL

Una vez que el sistema sabe a qué local va el pedido (por recogida o domicilio), el menú debe adaptarse:

- Los productos disponibles en ese local → se muestran normal, con carrito
- Los productos NO disponibles en ese local → se muestran con badge "No disponible hoy", sin botón de carrito, con opacidad reducida, pero SIEMPRE visibles (nunca ocultos)

Importante: cuando el usuario pide a domicilio, el local se asigna automáticamente según la dirección ANTES de mostrar el menú. No es en el momento del pago como ocurre actualmente.

**Pregunta para ti:** ¿Existe ya alguna lógica de disponibilidad de producto? ¿Cómo se renderizan actualmente los productos en el menú? ¿Hay algún componente de carta o listado de productos que puedas reutilizar?

---

## CASUÍSTICA 4 — GESTIÓN DE DISPONIBILIDAD EN EL PANEL ADMIN

En la sección de administración de productos del menú, queremos añadir la posibilidad de desactivar un producto para un local concreto.

**Flujo:**
1. El admin ve el listado de productos
2. Cada producto tiene un toggle de disponibilidad por local 
   (uno por cada local que acepta pedidos)
3. Al desactivar un toggle, aparece un diálogo con dos opciones:
   - **"Hasta mañana"** → el producto se reactiva automáticamente a la hora 
     de apertura del local al día siguiente
   - **"Desactivar temporalmente"** → queda desactivado hasta que el admin 
     lo reactive manualmente
4. El toggle muestra visualmente si la desactivación es temporal (con indicador 
   de tiempo restante) o indefinida

**Pregunta para ti:** ¿Existe ya una tabla de disponibilidad de productos? ¿O la disponibilidad se guarda como un campo booleano directamente en la tabla de productos? ¿Hay ya un panel admin de productos?

---

## CASUÍSTICA 5 — DESACTIVACIÓN EN CASCADA POR INGREDIENTE

Ya existe la opción de desactivar un ingrediente. Queremos que cuando el admin desactive un ingrediente, ANTES de guardar, el sistema muestre un modal con:

1. La lista de pizzas que usan ese ingrediente (paginada, máx. 6 por página)
2. Un toggle individual por local para cada pizza
3. Opción de "Desactivar todas" con un checkbox global
4. Botón "Confirmar" → aplica todos los cambios de golpe
5. Botón "Solo desactivar el ingrediente" → ignora las pizzas

**Pregunta para ti:** ¿Cómo está implementada actualmente la desactivación de ingredientes? ¿Qué tabla relaciona ingredientes con productos? ¿Hay ya algún modal en ese flujo?

---

## LO QUE QUIERO QUE HAGAS AHORA

1. Revisa la estructura de tablas en Supabase (especialmente: productos, ingredientes, locales/venues, disponibilidad, pedidos, horarios)
2. Revisa los componentes existentes relacionados con: menú, carrito, flujo de pedido, panel admin de productos
3. Para cada casuística descrita arriba, dime:
   - Qué existe ya y cómo está hecho
   - Qué habría que crear desde cero
   - Qué habría que modificar o extender
   - Qué riesgos o conflictos ves con la implementación actual
4. Propón el esquema de tablas nuevas o campos nuevos que habría que añadir a Supabase
5. NO implementes nada todavía. Solo dame el análisis y el plan.