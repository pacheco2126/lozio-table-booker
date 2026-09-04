import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  ShoppingBag,
  Warehouse,
  Tag,
  Users,
  ShieldCheck,
  Image as ImageIcon,
  BarChart3,
  Star,
  Search,
  BookOpen,
  Pizza,
  MapPin,
  Bike,
  PauseCircle,
  Bell,
  Briefcase,
  Smartphone,
  UserCircle,
  HelpCircle,
  LifeBuoy,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FAQ {
  q: string;
  a: string | string[];
}

interface Topic {
  id: string;
  icon: React.ReactNode;
  title: string;
  role: string;
  faqs: FAQ[];
}

// ─── Content ─────────────────────────────────────────────────────────────────

const TOPICS: Topic[] = [
  {
    id: "reservas",
    icon: <CalendarDays className="w-5 h-5" />,
    title: "Reservas",
    role: "Admin",
    faqs: [
      {
        q: "¿Cómo crear una reserva manual (por teléfono o walk-in)?",
        a: [
          "1. En el panel de admin, pulsa el botón «Nueva reserva» (esquina superior derecha).",
          "2. Selecciona el origen: Teléfono, Walk-in u Otro. Esto añade una etiqueta automática a las notas ([TELÉFONO], [WALK-IN] o [OTRO]).",
          "3. Rellena los campos obligatorios: Local, Fecha, Hora (slots fijos), Nombre del cliente y Teléfono.",
          "4. El número de comensales se limita automáticamente a la capacidad máxima disponible del local.",
          "5. Pulsa «Crear reserva». El sistema asigna mesa automáticamente.",
          "Importante: la creación manual de reservas está habilitada únicamente para el local de Arrabassada.",
        ],
      },
      {
        q: "¿Cómo editar o cambiar el estado de una reserva?",
        a: [
          "En la lista de reservas, haz clic sobre la reserva y usa el icono de lápiz para editar.",
          "Puedes cambiar: fecha, hora, comensales, nombre, teléfono y notas.",
          "Para cambiar el estado (Confirmada → Cancelada), usa el selector de estado dentro de la ficha.",
          "El sistema comprueba disponibilidad en tiempo real: si no hay mesa disponible para la nueva fecha/hora, te avisará y no guardará el cambio.",
        ],
      },
      {
        q: "¿Cómo filtrar y buscar reservas?",
        a: [
          "Arriba de la lista tienes filtros por local (Todos / Tarragona / Arrabassada) y por estado (Todos / Pendiente / Confirmada / Cancelada).",
          "Las reservas canceladas del día están ocultas por defecto para no ensuciar la vista del servicio; se muestran al filtrar por «Cancelada».",
        ],
      },
      {
        q: "¿Cómo activar o desactivar las reservas online para los clientes?",
        a: [
          "En la pestaña «Reservas», localiza el interruptor «Reservas activas / Reservas desactivadas» (arriba de la lista).",
          "Pulsa el interruptor → aparecerá un diálogo de confirmación.",
          "Confirma la acción. Los clientes dejarán de poder (o podrán) crear reservas online de inmediato.",
          "Esta opción NO afecta a las reservas manuales que puedes crear desde el panel.",
        ],
      },
      {
        q: "¿Cuáles son los horarios y limitaciones del sistema de reservas?",
        a: [
          "Horarios disponibles: 19:00, 19:30, 20:00, 20:30, 21:00, 21:30, 22:00.",
          "Cada reserva ocupa la mesa una ventana de 90 minutos.",
          "Máximo por grupo: limitado por las mesas activas del local.",
          "Para grupos de más de 6 personas el sistema puede combinar varias mesas y añade una nota del tipo [Grupo 4p: Mesa1 + Mesa2].",
          "La asignación automática usa las mesas M1–M8; las mesas M9 y superiores son comodines de uso manual.",
          "Existe un control anti-duplicados: el mismo teléfono no puede reservar dos veces la misma franja.",
          "Las reservas se crean con estado «Confirmada» cuando el sistema asigna mesa automáticamente.",
        ],
      },
      {
        q: "¿Cómo usar el plano del local?",
        a: [
          "Ve a la pestaña «Reservas» → sub-pestaña «Plano».",
          "Muestra la distribución visual de las mesas del local con su estado en tiempo real.",
          "Las mesas en gris están libres; las rojas y color bronce indican que hay una reserva en esa mesa pronto.",
          "Las azules son mesa comodín: el programa no las asigna automáticamente.",
          "Puedes moverte por horas con las flechas para ver la ocupación de cada franja.",
          "Haz doble clic en una mesa para ver los detalles de la reserva asignada.",
        ],
      },
      {
        q: "¿Cómo asignar las mesas comodín (azules en el plano del salón)?",
        a: [
          "Ve a la pestaña «Reservas» → sub-pestaña «Plano».",
          "Haz doble clic en una mesa azul para crear una reserva. OJO:",
          "La hora que esté seleccionada en la vista del plano (cambia con las flechas) será la hora en la que se cree la reserva.",
          "Guardará solo esa mesa, independientemente del número de personas.",
          "Si necesitas más mesas para la misma reserva, repite la operación.",
        ],
      },
      {
        q: "¿El cliente recibe aviso de su reserva?",
        a: [
          "Actualmente el cliente recibe notificación push en su dispositivo cuando hace una reserva online y cuando se acerca la hora (recordatorio automático unos 30 min antes).",
          "El recordatorio se envía mediante una tarea programada, siempre que el cliente tenga sesión iniciada y las notificaciones activadas.",
          "El teléfono sigue siendo obligatorio porque en el futuro se usará para WhatsApp; de momento no se envían mensajes de WhatsApp ni emails de reserva.",
        ],
      },
    ],
  },
  {
    id: "pedido-cliente",
    icon: <Bike className="w-5 h-5" />,
    title: "Pedidos online: el recorrido del cliente",
    role: "Todos (conocer)",
    faqs: [
      {
        q: "¿Cómo hace un pedido un cliente, paso a paso?",
        a: [
          "1. Pulsa «Hacer un pedido» en la portada. Se abre el diálogo «¿Cómo lo quieres?»: Recogida en local o Entrega a domicilio.",
          "2. Si elige recogida, selecciona el local. Si elige entrega, escribe la dirección (con autocompletado) y el sistema busca el local más cercano.",
          "3. Se abre la carta filtrada por ese local: solo aparecen los platos disponibles allí.",
          "4. Añade productos al carrito (con extras, ingredientes y sugerencias de upsell dentro del carrito).",
          "5. Va a «Finalizar pedido» (/pedido) y completa: ¿Cuándo quieres tu pedido? → Datos de contacto (incluida la dirección) → Notas → Método de pago → Código de descuento.",
          "6. Paga en efectivo o con tarjeta (Stripe) y llega a la pantalla de confirmación con el seguimiento del estado.",
        ],
      },
      {
        q: "¿Por qué a veces me pide elegir local antes de añadir un producto?",
        a: [
          "Porque el precio, la disponibilidad y el reparto dependen del local. Si el cliente entra directamente a la carta sin haber elegido local, al pulsar «Añadir» se abre un diálogo para escoger recogida/entrega y local.",
          "Si el carrito ya tiene productos y no hay local seleccionado, ese diálogo se abre automáticamente al entrar en el carrito o en el checkout.",
        ],
      },
      {
        q: "¿Qué diferencia hay entre entrar a la carta desde «Reservar mesa» y desde «Hacer un pedido»?",
        a: [
          "Desde «Reservar mesa» la carta es solo de lectura: no aparecen botones «Añadir» (es un menú informativo).",
          "Desde «Hacer un pedido» la carta es interactiva y permite añadir al carrito.",
          "La cabecera de la carta muestra el nombre del local seleccionado (p. ej. «Tarragona»); si no hay local, no muestra ninguno.",
        ],
      },
      {
        q: "¿Qué se muestra en el checkout y en qué orden?",
        a: [
          "«¿Cuándo quieres tu pedido?» (cuanto antes o programado), «Datos del contacto» (nombre, teléfono y dirección ya introducida), «Notas (opcional)», «Método de pago» y «¿Tienes un código de descuento?».",
          "En entregas a domicilio el campo «Piso / planta» es obligatorio.",
          "Los códigos de descuento solo están disponibles para clientes con la sesión iniciada; a los invitados se les ofrece iniciar sesión sin perder el pedido.",
        ],
      },
      {
        q: "¿Quién puede hacer pedidos ahora mismo?",
        a: [
          "El pedido online está en fase de pruebas: el botón «Hacer un pedido» y los botones «Añadir» de la carta solo están activos para usuarios con rol Admin.",
          "Para el resto de clientes el botón aparece con la etiqueta «Próximamente».",
        ],
      },
    ],
  },
  {
    id: "pedidos",
    icon: <ShoppingBag className="w-5 h-5" />,
    title: "Pedidos: gestión en el local",
    role: "Admin / Staff",
    faqs: [
      {
        q: "¿Cómo acceder a la gestión de pedidos de un local?",
        a: [
          "Desde el panel de admin, pestaña «Pedidos», pulsa «Ver pedidos» del local correspondiente.",
          "O accede directamente a /admin/pedidos/tarragona o /admin/pedidos/arrabassada.",
          "Los camareros con rol pizzeria* ven automáticamente los pedidos de su local en la ventana emergente de pedidos entrantes.",
        ],
      },
      {
        q: "¿Cuáles son los estados de un pedido y cómo avanzarlos?",
        a: [
          "Flujo estándar: Pendiente → Confirmado → Preparando → Listo/En camino → Entregado.",
          "Pulsa el botón principal del pedido para avanzar al siguiente estado.",
          "Para saltar a cualquier otro estado (incluyendo Cancelado), usa el menú desplegable (⋮) del pedido.",
          "Cada cambio de estado notifica al cliente por notificación push (WhatsApp no está activo por ahora).",
        ],
      },
      {
        q: "¿Cómo cancelar un pedido y emitir un reembolso?",
        a: [
          "En el menú (⋮) del pedido, selecciona «Cancelar y reembolsar».",
          "Si el pago fue con tarjeta y está pagado, se emite automáticamente un reembolso Stripe (plazo: 5–10 días hábiles).",
          "Si el pago fue en efectivo, gestiónalo manualmente fuera del sistema.",
          "Recomendado: llama al cliente antes de cancelar para avisarle.",
          "El reembolso es por el total del pedido, no parcial.",
        ],
      },
      {
        q: "¿Qué información muestra cada pedido?",
        a: [
          "Nombre y teléfono del cliente.",
          "Tipo: Entrega a domicilio (Reparto) o Recogida en local.",
          "Método de pago: Efectivo o Tarjeta.",
          "Estado del pago: Sin cobrar / Pagado / Fallido / Reembolsado.",
          "Artículos, cantidades y precios individuales.",
          "Notas del cliente.",
          "Total del pedido.",
          "Si el pedido es programado, se muestra la hora de entrega con una etiqueta morada.",
        ],
      },
      {
        q: "¿Cómo funciona la ventana emergente de pedidos entrantes?",
        a: [
          "Los pedidos nuevos aparecen automáticamente en una ventana flotante con sonido de alerta.",
          "Al iniciar sesión o abrir la pantalla, el sistema también busca los pedidos que quedaron en estado «Pendiente» y los muestra: ninguno se pierde por cerrar la pestaña.",
          "Confirma el pedido (introduce el tiempo estimado en minutos) o recházalo indicando un motivo.",
          "Si un local no puede atender el pedido, puede transferirlo al otro local con el botón «Transferir».",
          "La ventana muestra los pedidos en cola uno a uno.",
        ],
      },
      {
        q: "¿Qué pasa si nadie atiende un pedido pendiente?",
        a: [
          "Hay una tarea automática que cancela los pedidos que llevan demasiado tiempo sin confirmar (por ejemplo si el local está cerrado o en pausa) para no dejar al cliente esperando.",
          "Si un pedido desaparece de la cola en estado cancelado, revisa si el local estaba cerrado o con los pedidos pausados.",
        ],
      },
    ],
  },
  {
    id: "pausa-pedidos",
    icon: <PauseCircle className="w-5 h-5" />,
    title: "Pausar pedidos (local saturado)",
    role: "Admin / Staff",
    faqs: [
      {
        q: "¿Para qué sirve pausar los pedidos?",
        a: [
          "Sirve para dejar de recibir pedidos en un local cuando está saturado o no puede producir más, sin tener que rechazarlos uno a uno.",
          "El efecto es el mismo que si el local estuviera cerrado: no se pueden hacer pedidos de recogida en ese local y el sistema no le reenvía pedidos de domicilio cercanos (los deriva al otro local o avisa de que no hay cobertura).",
        ],
      },
      {
        q: "¿Dónde y cómo se pausa?",
        a: [
          "En /admin/pedidos/tarragona o /admin/pedidos/arrabassada, panel «Pausar pedidos» (arriba, antes de las estadísticas).",
          "Activa el interruptor «Pausar pedidos» y elige una de las tres opciones: «1 hora», «Todo el día (hasta el cierre)» o «Indefinido».",
          "Para reanudar, desactiva el interruptor. El cambio es inmediato y se propaga en tiempo real a todos los dispositivos y a la web pública.",
        ],
      },
      {
        q: "¿Cuándo se reanudan los pedidos automáticamente?",
        a: [
          "«1 hora»: se reanuda solo, una hora después de activarla.",
          "«Todo el día»: se reanuda al cierre del servicio (23:30). Si ya has pasado el cierre, la pausa se mantiene hasta el día siguiente.",
          "«Indefinido»: NO se reanuda solo; alguien debe desactivar el interruptor manualmente. Úsalo con cuidado.",
          "El panel muestra siempre hasta qué hora está pausado el local.",
        ],
      },
    ],
  },
  {
    id: "minimo-km",
    icon: <MapPin className="w-5 h-5" />,
    title: "Pedido mínimo por kilómetros",
    role: "Admin",
    faqs: [
      {
        q: "¿Cómo funciona el pedido mínimo?",
        a: [
          "En las entregas a domicilio el importe mínimo depende de la distancia entre la dirección del cliente y la pizzería.",
          "El sistema geocodifica la dirección, calcula los kilómetros al local más cercano y aplica el tramo correspondiente.",
          "Configuración de partida: hasta 3 km → 9,50 €; de 3 a 6 km → 15,00 €; de 6 a 10 km → 20,00 €.",
          "Si la dirección queda fuera del último tramo configurado, se considera fuera de zona de reparto.",
        ],
      },
      {
        q: "¿Cómo cambio los tramos y los importes?",
        a: [
          "Admin → pestaña «Pedido mínimo (km)».",
          "Selecciona el local arriba (Tarragona, Arrabassada o El Rincón): cada local tiene sus propios tramos.",
          "Edita los km máximos y el importe mínimo de cada tramo, añade o elimina tramos y guarda.",
          "Los km deben ser mayores que 0 y los importes no pueden ser negativos.",
        ],
      },
      {
        q: "¿Dónde ve el cliente que no llega al mínimo?",
        a: [
          "En el pie del carrito (CartDrawer) aparece el aviso de que falta importe para llegar al mínimo, y también el aviso de dirección fuera de zona de reparto.",
          "Mientras no se alcance el mínimo, no se puede finalizar el pedido de entrega a domicilio.",
        ],
      },
    ],
  },
  {
    id: "productos",
    icon: <Pizza className="w-5 h-5 shrink-0" />,
    title: "Carta (Productos)",
    role: "Admin",
    faqs: [
      {
        q: "¿Cómo añadir un nuevo producto al menú?",
        a: [
          "Admin → pestaña «Productos» → «Nuevo producto».",
          "Rellena: nombre (obligatorio), categoría, descripción, precio y orden de visualización.",
          "Los alérgenos se seleccionan con checkboxes; puedes marcar varios.",
          "El badge (texto + emoji + estilo) es opcional y añade una etiqueta visual al producto (ej. 🔥 Picante, ⭐ Top).",
          "El orden de visualización controla la posición en la carta: «CREA TU PIZZA» está en 0 para salir siempre primera.",
        ],
      },
      {
        q: "¿Cómo activo o desactivo un plato en un local concreto?",
        a: [
          "Ya no existe el interruptor global «Visible»: la disponibilidad se gestiona local por local.",
          "En la fila del producto verás un interruptor por cada local. Desactívalo para que ese plato desaparezca de la carta de ese local.",
          "Opción «Solo hasta mañana (19:00)»: desactiva el plato temporalmente y el sistema lo reactiva solo al día siguiente. La fila muestra un aviso de reactivación próxima.",
          "Volver a activar el interruptor borra cualquier fecha de reactivación pendiente.",
        ],
      },
      {
        q: "¿Qué son las cascadas de ingredientes?",
        a: [
          "Los platos están vinculados a ingredientes del inventario. Si un ingrediente o un Extra deja de estar disponible, los platos que lo llevan tampoco deberían venderse.",
          "Al desactivar un Extra o un ingrediente en un local, se abre un diálogo con la lista de pizzas, focaccias y calzones que lo usan y te pregunta si quieres desactivarlos también en ese local.",
          "Puedes seleccionar o deseleccionar platos concretos antes de confirmar.",
          "Los enlaces solo se aplican a pizzas, focaccias y calzones (no a bebidas ni postres).",
          "Si un Extra no está vinculado a ningún ingrediente del inventario, el sistema te lo indica: hay que vincularlo para que la cascada funcione.",
        ],
      },
      {
        q: "¿Cómo busco un producto? La lista es muy larga",
        a: [
          "Cada categoría tiene su propio buscador por nombre y la lista se pagina en bloques de 10 artículos.",
          "Arriba aparece un aviso ámbar cuando hay platos o ingredientes desactivados, con acceso para ver cuáles son.",
        ],
      },
      {
        q: "¿Cómo cambiar rápidamente el precio de un producto?",
        a: [
          "En la lista de productos, haz clic directamente sobre el precio.",
          "Aparece un campo de edición inline. Modifica el valor y pulsa ✓ para guardar o ✕ para cancelar.",
          "No necesitas abrir el diálogo completo de edición.",
        ],
      },
      {
        q: "¿Cuáles son las categorías disponibles?",
        a: [
          "Pizzas, Focaccias, Calzones, Extras, Bebidas, Postres.",
          "No se pueden crear nuevas categorías desde la interfaz.",
        ],
      },
    ],
  },
  {
    id: "inventario",
    icon: <Warehouse className="w-5 h-5" />,
    title: "Inventario",
    role: "Admin / GOD / Staff",
    faqs: [
      {
        q: "¿Cómo hacer un recuento de stock?",
        a: [
          "Ve a Admin → Inventario (o /admin/inventario).",
          "Selecciona el local en el desplegable superior.",
          "En la lista de artículos, pulsa «Recuento» en el artículo que quieras actualizar.",
          "Introduce la cantidad exacta que hay en ese momento (valor absoluto, p.ej. «3 botes»).",
          "Añade una nota opcional (p.ej. «revisado antes del cierre del domingo») y guarda.",
          "La cantidad se actualiza al instante en todos los dispositivos.",
        ],
      },
      {
        q: "¿Cómo registrar una entrada de mercancía (compra)?",
        a: [
          "En el artículo, pulsa «+ Entrada».",
          "Introduce cuántas unidades se añaden (p.ej. «10 botes»). El sistema suma esta cantidad al stock actual.",
          "Añade una nota opcional (p.ej. «pedido proveedor #38»).",
          "El historial de movimientos queda registrado con tu usuario y la fecha.",
        ],
      },
      {
        q: "¿Qué es la lista «Para comprar»?",
        a: [
          "Es la pestaña de inventario que muestra únicamente los artículos cuyo stock actual está por debajo del mínimo configurado.",
          "Muestra la cantidad actual, el mínimo y las unidades que faltan para alcanzar el objetivo.",
          "Úsala el lunes por la mañana para saber qué hay que reponer.",
          "Puedes imprimirla con el botón «Imprimir lista».",
        ],
      },
      {
        q: "¿Cómo añadir, editar o eliminar artículos del catálogo?",
        a: [
          "Solo los roles Admin y GOD pueden gestionar el catálogo.",
          "Para añadir: pulsa «Nuevo artículo» (esquina superior derecha). Rellena nombre, unidad, categoría, locales donde aplica, mínimo de reposición y (opcionalmente) cantidad objetivo.",
          "Para editar: icono de lápiz en la fila del artículo.",
          "Para eliminar: icono de papelera → confirma en el diálogo. Se eliminará el artículo y todo su historial. Esta acción no se puede deshacer.",
          "El campo «Locales» controla en qué locales aparece el artículo (importante: El Rincón tiene productos distintos a las pizzerías).",
          "Hay buscador por nombre y un aviso ámbar con los ingredientes desactivados.",
        ],
      },
      {
        q: "¿Qué relación tiene el inventario con la carta?",
        a: [
          "Los ingredientes del inventario se vinculan a los platos. Al desactivar un ingrediente en un local, el sistema propone desactivar también los platos que lo llevan (ver «Cascadas de ingredientes» en Carta).",
          "Así se evita vender una pizza cuyo ingrediente se ha terminado.",
        ],
      },
      {
        q: "¿Qué puede hacer cada rol en el inventario?",
        a: [
          "GOD / Admin: gestión completa — recuentos, entradas, crear/editar/eliminar artículos, configurar mínimos.",
          "pizzeriaTarragona / pizzeriaArrabassada / pizzeriaRincon: recuentos y entradas solo de su local. No pueden modificar el catálogo ni los mínimos.",
          "Roles sin inventario asignado: no tienen acceso a esta sección.",
        ],
      },
    ],
  },
  {
    id: "descuentos",
    icon: <Tag className="w-5 h-5" />,
    title: "Descuentos",
    role: "Admin",
    faqs: [
      {
        q: "¿Cómo crear un código de descuento?",
        a: [
          "Admin → pestaña «Descuentos» → «Nuevo descuento».",
          "El código se genera automáticamente en formato XXXX-XXXX. Puedes regenerarlo con el botón de varita o escribir uno personalizado.",
          "Rellena: nombre interno (solo visible en admin), tipo (% o €), valor, importe mínimo del pedido (opcional) y fecha de caducidad.",
          "El límite de usos es opcional (vacío = ilimitado).",
          "Actívalo con el interruptor antes de que los clientes puedan usarlo.",
        ],
      },
      {
        q: "¿Cómo asignar un descuento a un cliente específico?",
        a: [
          "Al crear o editar un descuento, pulsa «Asignar usuarios».",
          "Busca al cliente por email o nombre en la lista.",
          "Marca su casilla y guarda. El código solo funcionará para ese cliente.",
          "Si no se asigna a nadie, el código es público (cualquier cliente puede usarlo).",
          "El cliente ve sus descuentos asignados en su perfil (/perfil).",
        ],
      },
      {
        q: "¿Quién puede canjear un descuento?",
        a: [
          "Solo los clientes con la sesión iniciada. En el checkout, los invitados ven una invitación a iniciar sesión (se conserva el pedido en curso).",
        ],
      },
      {
        q: "¿Cómo desactivar un descuento sin eliminarlo?",
        a: [
          "En la lista de descuentos, usa el interruptor de la columna «Activo».",
          "El descuento queda inactivo pero conserva su historial de usos.",
          "Puedes reactivarlo en cualquier momento.",
        ],
      },
      {
        q: "¿Cuándo puedo eliminar un descuento?",
        a: [
          "Solo se puede eliminar si el contador de usos es 0 (nadie lo ha utilizado).",
          "Si ya tiene usos, desactívalo en lugar de eliminarlo para conservar el historial.",
        ],
      },
      {
        q: "¿Cómo ver cuántas veces se ha usado un descuento?",
        a: [
          "En la lista de descuentos, la columna «Usos» muestra «X / Y» (usados / límite).",
          "Si no hay límite, muestra solo el número de usos totales.",
        ],
      },
    ],
  },
  {
    id: "empleo",
    icon: <Briefcase className="w-5 h-5" />,
    title: "Empleo (Trabaja con nosotros)",
    role: "Admin",
    faqs: [
      {
        q: "¿Dónde ven los candidatos las ofertas?",
        a: [
          "En /empleo, accesible desde la sección «Corporativo» del pie de página, y desde el menú del panel de admin.",
          "Cada oferta tiene su ficha en /empleo/{id} con la descripción completa y el botón para enviar la candidatura.",
          "Las tarjetas muestran ubicación, modalidad de trabajo, jornada y nivel. El identificador interno de la vacante nunca se muestra al público.",
        ],
      },
      {
        q: "¿Cómo publico una nueva oferta?",
        a: [
          "Desde el formulario de vacantes del panel de admin.",
          "Campos: Ubicación, Descripción, Modalidad de trabajo (presencial / teletrabajo / híbrido), Subcategoría, Sector, Jornada laboral, Nivel profesional, Departamento y el interruptor «Activo».",
          "Casi todos los campos son selectores con los valores estándar del sector (Turismo y restauración, Restauración, Hostelería y restaurantes, Parcial (Noche), Empleado…).",
          "Desactiva «Activo» para retirar la oferta de la web sin borrarla.",
        ],
      },
      {
        q: "¿Cómo elimino una oferta?",
        a: [
          "Solo un usuario con rol Admin ve el botón «Eliminar» en el formulario de la vacante.",
          "Pide confirmación en un diálogo y el borrado es definitivo.",
          "Si la oferta solo es temporal, es mejor desactivarla que eliminarla.",
        ],
      },
    ],
  },
  {
    id: "notificaciones",
    icon: <Bell className="w-5 h-5" />,
    title: "Notificaciones y avisos",
    role: "Admin / Staff",
    faqs: [
      {
        q: "¿Cómo me avisa el sistema de un pedido o reserva nueva?",
        a: [
          "Con sonido de alerta + ventana flotante dentro de la aplicación, y con notificación push en el dispositivo (móvil u ordenador).",
          "Activa las notificaciones en Admin → pestaña «Notificaciones» (interruptor de notificaciones push) y acepta el permiso del navegador.",
          "Al pulsar la notificación push, la app te lleva directamente al pedido correspondiente.",
        ],
      },
      {
        q: "¿Qué recibe el cliente?",
        a: [
          "Reservas: notificación push de confirmación y recordatorio (no WhatsApp ni email por ahora).",
          "Pedidos: notificación push y aviso de cada cambio de estado; puede seguir el pedido en /mis-pedidos.",
          "El cliente gestiona sus propias notificaciones desde /perfil.",
        ],
      },
      {
        q: "No recibo notificaciones, ¿qué compruebo?",
        a: [
          "1. Que tengas sesión iniciada con el usuario que tiene el rol correcto.",
          "2. Que el permiso de notificaciones del navegador esté concedido (si lo bloqueaste, hay que reactivarlo en los ajustes del navegador).",
          "3. En iPhone, las notificaciones push requieren tener la web instalada como app en la pantalla de inicio.",
          "4. Que el dispositivo no esté en modo silencio/ahorro de batería.",
        ],
      },
    ],
  },
  {
    id: "clientes",
    icon: <Users className="w-5 h-5" />,
    title: "Clientes",
    role: "Admin",
    faqs: [
      {
        q: "¿Qué información puedo ver de un cliente?",
        a: [
          "Admin → pestaña «Clientes».",
          "Busca por nombre o teléfono en la barra superior.",
          "Al hacer clic en un cliente, ves: nombre, email, teléfono, ciudad, preferencias alimentarias, fecha de registro y notas internas.",
        ],
      },
      {
        q: "¿Qué son las notas internas y cómo se usan?",
        a: [
          "Son notas visibles solo para el equipo admin (nunca para el cliente).",
          "Ejemplos de uso: «alérgico al marisco aunque no lo indicó», «cliente VIP», «prefiere mesa del fondo».",
          "Para editar: abre el perfil del cliente y pulsa el icono de lápiz junto a las notas.",
          "Solo los admins pueden escribir o editar estas notas (protegido por la base de datos).",
        ],
      },
      {
        q: "¿Puedo eliminar un cliente?",
        a: [
          "No hay función de eliminación de clientes desde el panel.",
          "Las solicitudes de borrado de datos (RGPD) deben gestionarse desde el backend por el responsable técnico.",
        ],
      },
    ],
  },
  {
    id: "cuenta-cliente",
    icon: <UserCircle className="w-5 h-5" />,
    title: "Cuentas de cliente",
    role: "Todos (conocer)",
    faqs: [
      {
        q: "¿Cómo se registra o inicia sesión un cliente?",
        a: [
          "En /auth, con email y contraseña o con Google / Apple.",
          "Si olvida la contraseña, recibe un enlace de recuperación y la cambia en /reset-password.",
          "No existen cuentas anónimas: para reservar o pedir con cuenta hay que registrarse.",
        ],
      },
      {
        q: "¿Qué puede hacer el cliente desde su cuenta?",
        a: [
          "/perfil: editar sus datos, preferencias alimentarias, ver sus descuentos y gestionar notificaciones. En móvil el diseño es de tarjeta, con botón de cerrar sesión en forma de icono.",
          "/mis-reservas: ver y cancelar sus reservas.",
          "/mis-pedidos: seguir sus pedidos en tiempo real y consultar el historial.",
          "Aplicar códigos de descuento en el checkout (solo con sesión iniciada).",
        ],
      },
      {
        q: "Un cliente dice que no encuentra su reserva o pedido",
        a: [
          "Comprueba que inició sesión con el mismo email con el que reservó. Las reservas hechas por teléfono desde el panel no quedan ligadas a su cuenta.",
          "Puedes localizar cualquier reserva o pedido desde el panel buscando por nombre o teléfono.",
        ],
      },
    ],
  },
  {
    id: "media",
    icon: <ImageIcon className="w-5 h-5" />,
    title: "Media (Imágenes y vídeos)",
    role: "Admin",
    faqs: [
      {
        q: "¿Cómo subir imágenes o vídeos?",
        a: [
          "Admin → pestaña «Media».",
          "Selecciona la pestaña según el tipo de contenido: Menú, Locales o Vídeos de fondo.",
          "Para Menú y Locales: primero selecciona a qué plato o local pertenece la imagen (obligatorio).",
          "Para Vídeos de fondo: puedes subir directamente (se usan en el vídeo de portada).",
          "Pulsa «Subir» o arrastra los archivos. Puedes subir varios a la vez.",
          "Formatos aceptados: JPEG, PNG, WebP (imágenes); MP4, WebM, MOV (vídeos).",
        ],
      },
      {
        q: "¿Por qué una foto no aparece en el plato correcto?",
        a: [
          "Porque la asociación se hace por coincidencia exacta con la referencia del plato. Si el nombre del plato cambia o la imagen se sube sin seleccionar el plato, no se vincula.",
          "Solución: elimina la imagen y vuelve a subirla seleccionando el plato correcto.",
        ],
      },
      {
        q: "¿Cómo eliminar una imagen o vídeo?",
        a: [
          "Pasa el cursor por encima del archivo para que aparezca el botón de eliminar.",
          "La eliminación borra el archivo tanto de la galería como del almacenamiento.",
          "Esta acción no se puede deshacer.",
        ],
      },
      {
        q: "¿Hay límite de tamaño de archivo?",
        a: [
          "Sí, lo aplica el almacenamiento del backend (habitualmente 50 MB por archivo).",
          "No se muestra mensaje de límite en la interfaz; si falla la subida, comprueba el tamaño y comprime el vídeo.",
        ],
      },
    ],
  },
  {
    id: "roles",
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Roles de usuario",
    role: "Admin",
    faqs: [
      {
        q: "¿Qué roles existen y qué puede hacer cada uno?",
        a: [
          "Admin: acceso completo al panel — reservas, pedidos, productos, clientes, medios, roles, inventario (catálogo incluido), descuentos, pedido mínimo, empleo y reportes. Además es el único que puede hacer pedidos mientras el pedido online está en pruebas.",
          "GOD (Propietario): acceso completo al módulo de inventario de los 3 locales — recuentos, entradas, catálogo y lista de compra. Es el rol del dueño del restaurante.",
          "pizzeriaTarragona: gestión de pedidos del local Tarragona + inventario (solo recuentos y entradas) de Tarragona.",
          "pizzeriaArrabassada: igual que pizzeriaTarragona pero para Arrabassada.",
          "pizzeriaRincon: igual pero para El Rincón de Lo Zio.",
          "Cliente (sin rol): solo web pública y su zona personal.",
        ],
      },
      {
        q: "¿Cómo asignar o quitar un rol a un usuario?",
        a: [
          "Admin → pestaña «Roles».",
          "Busca al usuario por email o nombre.",
          "Pulsa el botón del rol que quieres asignar («Asignar Tarragona», «⚡ Hacer God», etc.).",
          "Para quitarlo, el mismo botón cambia a «Quitar …».",
          "Los cambios son inmediatos (puede que el usuario tenga que recargar la página).",
        ],
      },
      {
        q: "¿Un usuario puede tener varios roles?",
        a: [
          "Sí. Por ejemplo, un usuario puede tener a la vez «pizzeriaTarragona» y «GOD».",
          "El sistema aplica el nivel de permisos más alto.",
          "Recomendación: el dueño del local debe tener el rol GOD; los camareros solo su rol de pizzería.",
        ],
      },
    ],
  },
  {
    id: "reportes",
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Reportes",
    role: "Admin",
    faqs: [
      {
        q: "¿Qué datos muestra la sección de Reportes?",
        a: [
          "Tarjetas resumen: reservas de hoy, esta semana, este mes y total histórico.",
          "Desglose por local: cuántas reservas tiene cada pizzería.",
          "Desglose por estado: Pendientes, Confirmadas, Canceladas.",
          "Franjas horarias populares: top 5 horas con más reservas.",
          "Gráfico de barras: reservas por día durante los últimos 30 días.",
        ],
      },
      {
        q: "¿Los datos incluyen reservas canceladas?",
        a: [
          "Sí. Los totales incluyen todos los estados (pendiente + confirmada + cancelada).",
          "La sección «Por estado» permite ver el desglose exacto.",
        ],
      },
      {
        q: "¿Puedo filtrar por fecha o exportar los datos?",
        a: [
          "Actualmente no hay filtro de fechas personalizado ni exportación a CSV/Excel.",
          "Los períodos disponibles son fijos: hoy, esta semana, este mes y total.",
        ],
      },
    ],
  },
  {
    id: "resenas",
    icon: <Star className="w-5 h-5" />,
    title: "Reseñas",
    role: "Admin",
    faqs: [
      {
        q: "¿Qué puedo hacer con las reseñas?",
        a: [
          "Admin → pestaña «Reseñas».",
          "Puedes ver todas las reseñas de los clientes con su puntuación (1–5 estrellas), categoría y comentario.",
          "Filtra por categoría (Restaurante, Comida, Web) o por puntuación.",
          "La sección muestra la media global y la media por categoría.",
          "No hay opción de editar ni eliminar reseñas desde el panel.",
        ],
      },
      {
        q: "¿Cómo deja una reseña un cliente?",
        a: [
          "Desde la sección de reseñas de la portada o en /resenas.",
          "Son anónimas, de 1 a 5 estrellas, con comentario de hasta 2000 caracteres.",
        ],
      },
      {
        q: "¿Qué categorías de reseña existen?",
        a: [
          "🍽️ Restaurante — valoración del local en general.",
          "🍕 Comida — valoración de los platos.",
          "💻 Web — valoración de la experiencia de uso de la plataforma.",
        ],
      },
    ],
  },
  {
    id: "faqs-publicas",
    icon: <HelpCircle className="w-5 h-5" />,
    title: "FAQs públicas y contenido de la web",
    role: "Admin",
    faqs: [
      {
        q: "¿Dónde están las preguntas frecuentes de los clientes?",
        a: [
          "En la ruta /faqs (antes estaban en la portada), enlazada desde la sección «Corporativo» del pie de página.",
          "Cubren horarios, entregas, alérgenos y dudas habituales, y están traducidas a los 4 idiomas.",
        ],
      },
      {
        q: "¿Cómo se cambian los textos de la web o se añade un idioma?",
        a: [
          "Todos los textos están centralizados en los archivos de traducción (es, en, ca, it). Cualquier texto nuevo debe añadirse en los 4 idiomas.",
          "Los cambios de textos y de diseño los realiza el responsable técnico; no se editan desde el panel.",
        ],
      },
      {
        q: "¿Dónde se ven los datos de los locales (dirección, horarios, teléfono)?",
        a: [
          "En /locales y en la ficha de cada local, con mapa y datos de contacto.",
          "Los horarios de apertura son los que usa el sistema para permitir o bloquear pedidos: si el local está cerrado (o pausado), no se puede pedir para recoger allí.",
        ],
      },
    ],
  },
  {
    id: "pwa",
    icon: <Smartphone className="w-5 h-5" />,
    title: "App instalable (PWA) y actualizaciones",
    role: "Todos",
    faqs: [
      {
        q: "¿Cómo instalo la app en el móvil?",
        a: [
          "Al entrar en la web desde el móvil aparece un banner de instalación.",
          "Android/Chrome: «Añadir a pantalla de inicio». iPhone/Safari: botón Compartir → «Añadir a pantalla de inicio».",
          "Instalarla es imprescindible en iPhone para recibir notificaciones push.",
        ],
      },
      {
        q: "¿Por qué no veo los últimos cambios en la app instalada?",
        a: [
          "La app instalada usa la versión publicada de la web, no la de vista previa. Los cambios llegan cuando se publica una nueva versión.",
          "Cuando hay versión nueva aparece un banner de actualización: púlsalo y la app se recarga.",
          "La app comprueba si hay actualizaciones cada 30 segundos. En iPhone puede hacer falta cerrarla y volver a abrirla.",
        ],
      },
    ],
  },
  {
    id: "problemas",
    icon: <LifeBuoy className="w-5 h-5" />,
    title: "Problemas frecuentes",
    role: "Todos",
    faqs: [
      {
        q: "Un cliente no puede hacer un pedido, ¿qué mirar?",
        a: [
          "¿Tiene rol Admin? El pedido online está limitado a Admin mientras esté en pruebas.",
          "¿El local está cerrado por horario o con los pedidos pausados? Entonces se bloquea la recogida y el reparto de ese local.",
          "¿Su dirección está fuera del último tramo de km configurado? Sería fuera de zona de reparto.",
          "¿Llega al pedido mínimo del tramo? El aviso aparece al pie del carrito.",
          "¿Falta el campo «Piso» en una entrega? Es obligatorio.",
        ],
      },
      {
        q: "Un plato no aparece en la carta",
        a: [
          "Comprueba en Productos si su interruptor está desactivado para ese local, o si tiene una desactivación temporal «solo hasta mañana».",
          "También puede haberse desactivado en cascada al desactivar un ingrediente o un Extra.",
        ],
      },
      {
        q: "No hay mesas disponibles pero el plano parece vacío",
        a: [
          "Recuerda que cada reserva bloquea la mesa 90 minutos y que la vista del plano corresponde a una hora concreta (cámbiala con las flechas).",
          "Las mesas azules (comodín) no se asignan automáticamente: hay que asignarlas a mano.",
        ],
      },
      {
        q: "Algo no funciona y no está en esta guía",
        a: [
          "Anota qué estabas haciendo, en qué pantalla y con qué usuario, y avisa al responsable técnico.",
          "No cambies roles, precios ni disponibilidad «a ver si se arregla»: esos cambios afectan a la web pública al instante.",
        ],
      },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

const AdminGuide = () => {
  const [search, setSearch] = useState("");

  const filtered = TOPICS.map((topic) => ({
    ...topic,
    faqs: search.trim()
      ? topic.faqs.filter(
          (f) =>
            f.q.toLowerCase().includes(search.toLowerCase()) ||
            (Array.isArray(f.a)
              ? f.a.some((line) => line.toLowerCase().includes(search.toLowerCase()))
              : f.a.toLowerCase().includes(search.toLowerCase())),
        )
      : topic.faqs,
  })).filter((t) => t.faqs.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="w-5 h-5" />
          <p className="font-body text-sm">Guía de uso de la plataforma · Lo Zio</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 max-w-xs w-full">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Buscar en la guía…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="font-body h-8 text-sm"
          />
        </div>
      </div>

      {/* Índice */}
      {!search.trim() && (
        <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
          <p className="font-body text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Contenido de la guía
          </p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <a
                key={topic.id}
                href={`#guia-${topic.id}`}
                className="font-body text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors"
              >
                {topic.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground font-body py-10">
          No se encontraron resultados para «{search}».
        </p>
      )}

      {/* Topics */}
      <div className="space-y-4">
        {filtered.map((topic) => (
          <div
            key={topic.id}
            id={`guia-${topic.id}`}
            className="rounded-xl border border-border bg-card overflow-hidden scroll-mt-24"
          >
            {/* Topic header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-muted/50 border-b border-border">
              <span className="text-primary">{topic.icon}</span>
              <h2 className="font-display font-bold text-foreground">{topic.title}</h2>
              <Badge variant="secondary" className="ml-auto font-body text-xs shrink-0">
                {topic.role}
              </Badge>
            </div>

            {/* FAQs */}
            <Accordion type="multiple" className="divide-y divide-border">
              {topic.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`${topic.id}-${i}`} className="border-0">
                  <AccordionTrigger className="px-5 py-3 text-left font-body font-medium text-sm hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:bg-muted/30">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4 pt-0">
                    {Array.isArray(faq.a) ? (
                      <ol className="space-y-1.5 list-none">
                        {faq.a.map((line, j) => (
                          <li key={j} className="font-body text-sm text-muted-foreground leading-relaxed">
                            {line}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="font-body text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGuide;
