import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  ShoppingBag,
  Warehouse,
  Tag,
  Package,
  Users,
  ShieldCheck,
  Image as ImageIcon,
  BarChart3,
  Star,
  Search,
  BookOpen,
  Pizza,
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
          "Máximo por grupo: limitado por las mesas activas del local.",
          "Para grupos grandes (varios comensales), el sistema puede asignar varias mesas automáticamente y añade una nota del tipo [Grupo 4p: Mesa1 + Mesa2].",
          "Las reservas se crean con estado «Confirmada» cuando el sistema asigna mesa automáticamente.",
        ],
      },
      {
        q: "¿Cómo usar el plano del local?",
        a: [
          "Ve a la pestaña «Reservas» → sub-pestaña «Plano».",
          "Muestra la distribución visual de las mesas del local con su estado en tiempo real.",
          "Las mesas en verde están libres; las ocupadas muestran el nombre del cliente.",
          "Haz clic en una mesa para ver los detalles de la reserva asignada.",
        ],
      },
    ],
  },
  {
    id: "pedidos",
    icon: <ShoppingBag className="w-5 h-5" />,
    title: "Pedidos",
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
          "Flujo estándar: Pendiente → Confirmado → Preparando → Listo → Entregado.",
          "Pulsa el botón principal del pedido para avanzar al siguiente estado.",
          "Para saltar a cualquier otro estado (incluyendo Cancelado), usa el menú desplegable (⋮) del pedido.",
          "Pendiente y Confirmado envían email automático al cliente al cambiar de estado.",
        ],
      },
      {
        q: "¿Cómo cancelar un pedido y emitir un reembolso?",
        a: [
          "En el menú (⋮) del pedido, selecciona «Cancelar y reembolsar».",
          "Si el pago fue con tarjeta y está pagado, se emite automáticamente un reembolso Stripe (plazo: 5–10 días hábiles).",
          "Si el pago fue en efectivo, cámbialo manualmente fuera del sistema.",
          "Recomendado: llama al cliente antes de cancelar para avisarle.",
          "El reembolso es por el total del pedido, no parcial.",
        ],
      },
      {
        q: "¿Qué información muestra cada pedido?",
        a: [
          "Nombre, teléfono y email del cliente.",
          "Tipo: Entrega a domicilio (con dirección) o Recogida en local.",
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
          "Confirma el pedido (introduce el tiempo estimado en minutos) o recházalo con un motivo.",
          "Si un local no puede atender el pedido, puede transferirlo al otro local con el botón «Transferir».",
          "La ventana muestra los pedidos en cola uno a uno.",
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
          "Ve a Admin → Configuración → Inventario (o /admin/inventario).",
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
          "Admin → Configuración → Descuentos → «Nuevo descuento».",
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
    id: "productos",
    icon: <Pizza className="w-5 h-5 shrink-0" />,
    title: "Carta (Productos)",
    role: "Admin",
    faqs: [
      {
        q: "¿Cómo añadir un nuevo producto al menú?",
        a: [
          "Admin → Configuración → Productos → «Nuevo producto».",
          "Rellena: nombre (obligatorio), categoría, descripción, precio y orden de visualización.",
          "El campo «Visible» controla si el producto aparece en la carta pública.",
          "Los alérgenos se seleccionan con checkboxes; puedes marcar varios.",
          "El badge (texto + emoji + estilo) es opcional y añade una etiqueta visual al producto (ej. 🔥 Picante, ⭐ Top).",
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
        q: "¿Cómo ocultar un producto sin eliminarlo?",
        a: [
          "Edita el producto y desactiva el interruptor «Visible».",
          "El producto seguirá en la base de datos pero no aparecerá en la carta pública.",
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
    id: "clientes",
    icon: <Users className="w-5 h-5" />,
    title: "Clientes",
    role: "Admin",
    faqs: [
      {
        q: "¿Qué información puedo ver de un cliente?",
        a: [
          "Admin → Configuración → Clientes.",
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
          "Solo los admins pueden escribir o editar estas notas (protegido por trigger de base de datos).",
        ],
      },
      {
        q: "¿Puedo eliminar un cliente?",
        a: [
          "No, no hay función de eliminación de clientes desde el panel.",
          "Para cualquier solicitud de eliminación de datos (RGPD), gestionarlo directamente en Supabase.",
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
          "Admin: acceso completo al panel — reservas, pedidos, productos, clientes, medios, roles, inventario (catálogo incluido), descuentos, reportes.",
          "GOD (Propietario): acceso completo al módulo de inventario de los 3 locales — recuentos, entradas, catálogo y lista de compra. Es el rol del dueño del restaurante.",
          "pizzeriaTarragona: gestión de pedidos del local Tarragona + inventario (solo recuentos y entradas) de Tarragona.",
          "pizzeriaArrabassada: igual que pizzeriaTarragona pero para Arrabassada.",
          "pizzeriaRincon: igual pero para El Rincón de Lo Zio.",
        ],
      },
      {
        q: "¿Cómo asignar o quitar un rol a un usuario?",
        a: [
          "Admin → Configuración → Roles de usuario.",
          "Busca al usuario por email o nombre.",
          "Pulsa el botón del rol que quieres asignar («Asignar Tarragona», «⚡ Hacer God», etc.).",
          "Para quitarlo, el mismo botón cambia a «Quitar …».",
          "Los cambios son inmediatos.",
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
    id: "media",
    icon: <ImageIcon className="w-5 h-5" />,
    title: "Media (Imágenes y vídeos)",
    role: "Admin",
    faqs: [
      {
        q: "¿Cómo subir imágenes o vídeos?",
        a: [
          "Admin → Configuración → Media.",
          "Selecciona la pestaña según el tipo de contenido: Menú, Locales o Vídeos de fondo.",
          "Para Menú y Locales: primero selecciona a qué plato o local pertenece la imagen (obligatorio).",
          "Para Vídeos de fondo: puedes subir directamente.",
          "Pulsa «Subir» o arrastra los archivos. Puedes subir varios a la vez.",
          "Formatos aceptados: JPEG, PNG, WebP (imágenes); MP4, WebM, MOV (vídeos).",
        ],
      },
      {
        q: "¿Cómo eliminar una imagen o vídeo?",
        a: [
          "Pasa el cursor por encima del archivo para que aparezca el botón de eliminar.",
          "La eliminación borra el archivo tanto de la galería como del almacenamiento de Supabase.",
          "Esta acción no se puede deshacer.",
        ],
      },
      {
        q: "¿Hay límite de tamaño de archivo?",
        a: [
          "El límite lo aplica Supabase Storage (normalmente 50 MB por archivo en el plan gratuito).",
          "No se muestra mensaje de límite en la interfaz; si falla la subida comprueba el tamaño del archivo.",
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
          "Admin → Configuración → Reseñas.",
          "Puedes ver todas las reseñas de los clientes con su puntuación (1–5 estrellas), categoría y comentario.",
          "Filtra por categoría (Restaurante, Comida, Web) o por puntuación.",
          "La sección muestra la media global y la media por categoría.",
          "No hay opción de editar ni eliminar reseñas desde el panel.",
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
          <p className="font-body text-sm">Guía de uso del panel de administración · Lo Zio</p>
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

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground font-body py-10">
          No se encontraron resultados para «{search}».
        </p>
      )}

      {/* Topics */}
      <div className="space-y-4">
        {filtered.map((topic) => (
          <div key={topic.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Topic header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-muted/50 border-b border-border">
              <span className="text-primary">{topic.icon}</span>
              <h2 className="font-display font-bold text-foreground">{topic.title}</h2>
              <Badge variant="secondary" className="ml-auto font-body text-xs">
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
