import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/contexts/CartContext";
import { useOrderFlow } from "@/contexts/OrderFlowContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Store,
  CreditCard,
  Banknote,
  Minus,
  Plus,
  Trash2,
  Clock,
  Phone,
  User,
  Tag,
  X,
  Truck,
} from "lucide-react";
import { useDiscount, type DiscountReason } from "@/hooks/useDiscount";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { locationsData } from "@/lib/locations";
import { getNearestStore } from "@/lib/nearestStore";
import {
  computeDeliveryMinimumForAddress,
  type DeliveryMinimumResult,
} from "@/lib/deliveryMinimum";
import {
  isStoreOpen,
  getScheduleStatus,
  getAvailableDays,
  getTimeSlots,
  formatDayLabel,
  formatTime,
  type ScheduleStatus,
} from "@/lib/storeHours";
import { AlertTriangle, CalendarClock, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { z } from "zod";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const Checkout = () => {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const discount = useDiscount({ subtotal: totalPrice, enabled: !!user });
  const discountAmount = discount.applied?.discount_amount ?? 0;
  const finalTotal = Math.max(0, totalPrice - discountAmount);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const orderFlow = useOrderFlow();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileAddress, setProfileAddress] = useState<{
    address: string;
    city: string;
    postalCode: string;
  } | null>(null);

  // "asap" = as soon as possible (only when open), "scheduled" = user picks time
  const [scheduleMode, setScheduleMode] = useState<"asap" | "scheduled">(() =>
    getScheduleStatus().type === "open" ? "asap" : "scheduled"
  );
  const [scheduledDay, setScheduledDay] = useState<Date>(() => {
    const status = getScheduleStatus();
    return status.type !== "open" ? status.opensAt : new Date();
  });
  const [scheduledTime, setScheduledTime] = useState<string>(() => {
    const status = getScheduleStatus();
    if (status.type !== "open") return formatTime(status.opensAt.getHours(), status.opensAt.getMinutes());
    return "";
  });

  const isCurrentlyOpen = getScheduleStatus().type === "open";

  // Derive the final scheduledFor Date
  const scheduledFor: Date | null = (() => {
    if (scheduleMode === "asap") return null;
    if (!scheduledTime) return null;
    const [h, m] = scheduledTime.split(":").map(Number);
    const d = new Date(scheduledDay);
    d.setHours(h, m, 0, 0);
    return d;
  })();

  // Pre-fill contact info and address from user profile — wait for auth to finish loading
  useEffect(() => {
    if (authLoading || !user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, address, city, postal_code")
        .eq("user_id", user.id)
        .single();
      setForm((prev) => ({
        ...prev,
        name: data?.full_name ?? prev.name,
        phone: data?.phone ?? prev.phone,
        email: user.email ?? prev.email,
      }));
      if (data?.address) {
        setProfileAddress({
          address: data.address ?? "",
          city: data.city ?? "",
          postalCode: data.postal_code ?? "",
        });
      }
    };
    loadProfile();
  }, [user, authLoading]);

  const pickupStores = [
    { id: "tarragona", ...locationsData.tarragona },
    { id: "arrabassada", ...locationsData.arrabassada },
  ];

  const checkoutSchema = z
    .object({
      name: z.string().trim().min(1, t("checkout.nameRequired")).max(100),
      email: z.string().trim().email(t("checkout.emailInvalid")).max(255),
      phone: z.string().trim().min(9, t("checkout.phoneInvalid")).max(20),
      orderType: z.enum(["pickup", "delivery"]),
      pickupStore: z.string().optional(),
      address: z.string().optional(),
      streetNumber: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      paymentMethod: z.enum(["cash", "stripe"]),
      notes: z.string().max(500).optional(),
    })
    .refine(
      (data) => {
        if (data.orderType === "pickup") {
          return data.pickupStore && data.pickupStore.length > 0;
        }
        return true;
      },
      { message: "Debes seleccionar en qué local recoges el pedido", path: ["pickupStore"] },
    )
    .refine(
      (data) => {
        if (data.orderType === "delivery") {
          return data.address && data.address.trim().length > 0;
        }
        return true;
      },
      { message: t("checkout.addressRequired"), path: ["address"] },
    )
    .refine(
      (data) => {
        if (data.orderType === "delivery") {
          return data.streetNumber && data.streetNumber.trim().length > 0;
        }
        return true;
      },
      { message: "El número es obligatorio", path: ["streetNumber"] },
    )
    .refine(
      (data) => !(data.orderType === "delivery" && data.paymentMethod === "cash"),
      { message: "El pago en efectivo no está disponible para envíos a domicilio", path: ["paymentMethod"] },
    );

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    orderType: (orderFlow.orderType ?? "pickup") as "pickup" | "delivery",
    pickupStore: orderFlow.orderType === "pickup" ? (orderFlow.storeSlug ?? "") : "",
    address: orderFlow.address?.address ?? "",
    streetNumber: orderFlow.address?.streetNumber ?? "",
    city: orderFlow.address?.city ?? "",
    postalCode: orderFlow.address?.postalCode ?? "",
    staircase: "",
    floor: "",
    door: "",
    paymentMethod: "cash" as "cash" | "stripe",
    notes: "",
  });


  // Delivery minimum (based on distance from nearest store)
  const [deliveryMin, setDeliveryMin] = useState<DeliveryMinimumResult | null>(null);
  const [deliveryMinLoading, setDeliveryMinLoading] = useState(false);

  useEffect(() => {
    if (form.orderType !== "delivery") {
      setDeliveryMin(null);
      return;
    }
    const addr = form.address.trim();
    const num = form.streetNumber.trim();
    if (!addr || !num || !form.postalCode.trim()) {
      setDeliveryMin(null);
      return;
    }
    let cancelled = false;
    setDeliveryMinLoading(true);
    const handle = setTimeout(async () => {
      const fullAddress = `${addr} ${num}`;
      const at = scheduledFor ?? new Date();
      try {
        const result = await computeDeliveryMinimumForAddress(
          fullAddress,
          form.city,
          form.postalCode,
          at,
        );
        if (!cancelled) setDeliveryMin(result);
      } catch (err) {
        console.warn("[Checkout] deliveryMinimum error", err);
        if (!cancelled) setDeliveryMin(null);
      } finally {
        if (!cancelled) setDeliveryMinLoading(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.orderType,
    form.address,
    form.streetNumber,
    form.city,
    form.postalCode,
    scheduledFor?.getTime(),
  ]);

  const deliveryBelowMin =
    form.orderType === "delivery" &&
    deliveryMin !== null &&
    deliveryMin.geocoded &&
    deliveryMin.minOrderAmount !== null &&
    totalPrice < deliveryMin.minOrderAmount;

  const deliveryOutOfRange =
    form.orderType === "delivery" &&
    deliveryMin !== null &&
    deliveryMin.geocoded &&
    deliveryMin.minOrderAmount === null &&
    deliveryMin.maxKmConfigured > 0;

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (items.length === 0) {
      toast.error(t("checkout.emptyCartError"));
      return;
    }

    if (scheduleMode === "scheduled" && !scheduledFor) {
      toast.error("Selecciona una hora para programar tu pedido");
      return;
    }

    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);

      // Scroll to first error field
      const firstField = result.error.errors[0]?.path[0] as string | undefined;
      if (firstField) {
        setTimeout(() => {
          const el =
            document.getElementById(firstField) ||
            document.querySelector(`[data-field="${firstField}"]`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            if (el instanceof HTMLElement && typeof (el as HTMLInputElement).focus === "function") {
              (el as HTMLInputElement).focus({ preventScroll: true });
            }
          }
        }, 50);
      }
      toast.error(t("checkout.formIncomplete", { defaultValue: "Faltan datos por completar" }));
      return;
    }

    if (form.orderType === "delivery") {
      if (deliveryOutOfRange) {
        toast.error(
          `Esta dirección está fuera de nuestra zona de reparto (máx. ${deliveryMin?.maxKmConfigured?.toFixed(1)} km).`,
        );
        document.getElementById("address")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (deliveryBelowMin && deliveryMin?.minOrderAmount != null) {
        toast.error(
          `El pedido mínimo para tu dirección es ${deliveryMin.minOrderAmount.toFixed(2)} €.`,
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Determine the fulfillment time (scheduled or now)
      const fulfillAt = scheduledFor ?? new Date();

      // For delivery orders, auto-assign the nearest OPEN store at fulfillment time
      let assignedStore = form.orderType === "pickup" ? form.pickupStore : null;
      if (form.orderType === "delivery") {
        assignedStore = await getNearestStore(form.address, form.city, form.postalCode, fulfillAt);
      }
      // Rincon orders fall back to tarragona (no dedicated staff account)
      const assignedTo: "tarragona" | "arrabassada" =
        assignedStore === "arrabassada" ? "arrabassada" : "tarragona";

      // 1. Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          guest_name: form.name,
          guest_email: form.email,
          guest_phone: form.phone,
          order_type: form.orderType,
          pickup_store: assignedStore,
          assigned_to: assignedTo,
          delivery_address: form.orderType === "delivery"
            ? [
                [form.address, form.streetNumber].filter(Boolean).join(", "),
                form.staircase ? `Esc. ${form.staircase}` : null,
                form.floor ? `Piso ${form.floor}` : null,
                form.door ? `Puerta ${form.door}` : null,
              ].filter(Boolean).join(", ")
            : null,
          delivery_city: form.orderType === "delivery" ? form.city : null,
          delivery_postal_code: form.orderType === "delivery" ? form.postalCode : null,
          payment_method: form.paymentMethod,
          payment_status: "pending",
          notes: form.notes || null,
          total_amount: finalTotal,
          discount_id: discount.applied?.discount_id ?? null,
          discount_amount: discountAmount,
          scheduled_for: scheduledFor ? scheduledFor.toISOString() : null,
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items (including extras as part of description)
      const orderItems = items.map((item) => {
        const extrasList = (item.extras || [])
          .map((e) => `${e.emoji} ${e.label} ×${e.quantity}`)
          .join(", ");
        const extrasPrice = (item.extras || []).reduce((s, e) => s + e.price * e.quantity, 0);
        const descParts = [
          item.description,
          extrasList ? `Extras: ${extrasList}` : null,
          item.note ? `📝 ${item.note}` : null,
        ].filter(Boolean);
        return {
          order_id: order.id,
          item_name: item.name,
          item_description: descParts.join(" — ") || null,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity + extrasPrice,
        };
      });
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Stripe payment if selected
      if (form.paymentMethod === "stripe") {
        if (!stripe || !elements) {
          throw new Error(t("checkout.stripeNotLoaded"));
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error(t("checkout.stripeNotLoaded"));
        }

        // Get PaymentIntent clientSecret from Edge Function
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          "create-payment-intent",
          { body: { orderId: order.id } },
        );

        if (fnError || !fnData?.clientSecret) {
          throw new Error(fnError?.message || t("checkout.stripeError"));
        }

        // Confirm card payment
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          fnData.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: form.name,
                email: form.email,
                phone: form.phone,
              },
            },
          },
        );

        if (stripeError) {
          await supabase
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", order.id);
          throw new Error(stripeError.message || t("checkout.stripeError"));
        }

        if (paymentIntent?.status === "succeeded") {
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              stripe_payment_intent_id: paymentIntent.id,
            })
            .eq("id", order.id);
        }
      }

      clearCart();
      navigate(`/pedido-confirmado?id=${order.id}`);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : t("checkout.orderError");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-24 px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            {t("checkout.emptyTitle")}
          </h1>
          <p className="text-muted-foreground font-body mb-8">{t("checkout.emptyDesc")}</p>
          <Button
            onClick={() => navigate("/#menu")}
            className="bg-menu-teal hover:bg-menu-teal/90 text-menu-teal-foreground font-display"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {t("checkout.viewMenu")}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="pt-24 md:pt-28 pb-24 px-3 md:px-4">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/#menu")}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {t("checkout.backToMenu")}
          </Button>
          <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-8">
            {t("checkout.title")}
          </h1>

          {/* Schedule selector */}
          {(() => {
            const storeForSlots = form.orderType === "pickup" ? form.pickupStore || undefined : undefined;
            const availableDays = getAvailableDays(storeForSlots);
            const timeSlots = scheduleMode === "scheduled"
              ? getTimeSlots(scheduledDay, storeForSlots)
              : [];

            // Auto-select first slot if day changes and current slot is no longer valid
            const ensureValidTime = (day: Date) => {
              const slots = getTimeSlots(day, storeForSlots);
              if (slots.length > 0 && !slots.includes(scheduledTime)) {
                setScheduledTime(slots[0]);
              }
            };

            return (
              <div className="mb-6 bg-card border border-border rounded-xl p-5">
                <h2 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-menu-teal" />
                  ¿Cuándo quieres tu pedido?
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* ASAP option */}
                  <button
                    type="button"
                    disabled={!isCurrentlyOpen}
                    onClick={() => setScheduleMode("asap")}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${
                      scheduleMode === "asap"
                        ? "border-menu-teal bg-menu-teal/5"
                        : isCurrentlyOpen
                        ? "border-border hover:border-menu-teal/40"
                        : "border-border opacity-40 cursor-not-allowed bg-muted/30"
                    }`}
                  >
                    <Zap className="w-4 h-4 text-menu-teal shrink-0" />
                    <div>
                      <p className="font-display font-bold text-sm">Lo antes posible</p>
                      <p className="text-xs text-muted-foreground">
                        {isCurrentlyOpen ? "Estamos abiertos" : "Cerrado ahora"}
                      </p>
                    </div>
                  </button>

                  {/* Scheduled option */}
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleMode("scheduled");
                      if (!scheduledTime && timeSlots.length === 0) {
                        const slots = getTimeSlots(availableDays[0], storeForSlots);
                        setScheduledDay(availableDays[0]);
                        setScheduledTime(slots[0] ?? "");
                      } else if (!scheduledTime && timeSlots.length > 0) {
                        setScheduledTime(timeSlots[0]);
                      }
                    }}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${
                      scheduleMode === "scheduled"
                        ? "border-menu-teal bg-menu-teal/5"
                        : "border-border hover:border-menu-teal/40"
                    }`}
                  >
                    <CalendarClock className="w-4 h-4 text-menu-teal shrink-0" />
                    <div>
                      <p className="font-display font-bold text-sm">Programar</p>
                      <p className="text-xs text-muted-foreground">Elige día y hora</p>
                    </div>
                  </button>
                </div>

                {/* Day + time pickers */}
                {scheduleMode === "scheduled" && (
                  <div className="space-y-3">
                    {/* Day selector */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Día</p>
                      <div className="flex gap-2 flex-wrap">
                        {availableDays.map((day, i) => {
                          const isSelected =
                            day.getFullYear() === scheduledDay.getFullYear() &&
                            day.getMonth()    === scheduledDay.getMonth() &&
                            day.getDate()     === scheduledDay.getDate();
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setScheduledDay(day);
                                ensureValidTime(day);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                                isSelected
                                  ? "bg-menu-teal text-menu-teal-foreground border-menu-teal"
                                  : "border-border hover:border-menu-teal/40 text-foreground"
                              }`}
                            >
                              {formatDayLabel(day)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time selector */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hora</p>
                      {timeSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay horarios disponibles para este día.</p>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setScheduledTime(slot)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                                scheduledTime === slot
                                  ? "bg-menu-teal text-menu-teal-foreground border-menu-teal"
                                  : "border-border hover:border-menu-teal/40 text-foreground"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {scheduledFor && (
                      <p className="text-xs text-menu-teal font-semibold mt-1">
                        ✓ Pedido programado para el {formatDayLabel(scheduledDay)} a las {scheduledTime}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid lg:grid-cols-5 gap-8">
            <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
              {/* Contact + Address summary */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  {t("checkout.contactInfo")}
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t("checkout.name")} *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder={t("checkout.namePlaceholder")}
                    />
                    {errors.name && (
                      <p className="text-destructive text-xs mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">{t("checkout.phone")} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="612 345 678"
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">{t("checkout.email")} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="tu@email.com"
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Address / pickup summary (from OrderTypeDialog) */}
                <div className="mt-5 pt-5 border-t border-border">
                  {form.orderType === "delivery" ? (
                    <div className="rounded-lg border-2 border-menu-teal/30 bg-menu-teal/5 p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-menu-teal shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-sm text-foreground">
                            Entrega a domicilio
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">
                            {[
                              [form.address, form.streetNumber].filter(Boolean).join(", "),
                              [form.postalCode, form.city].filter(Boolean).join(" "),
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Sin dirección"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => orderFlow.openDialog()}
                          className="text-xs font-display font-bold text-menu-teal hover:underline shrink-0"
                        >
                          Cambiar
                        </button>
                      </div>
                      {(errors.address || errors.streetNumber) && (
                        <p className="text-destructive text-xs mt-2">
                          {errors.address || errors.streetNumber}
                        </p>
                      )}

                      {/* Escalera / Piso / Puerta */}
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div>
                          <Label htmlFor="staircase" className="text-xs">Escalera</Label>
                          <Input
                            id="staircase"
                            value={form.staircase}
                            onChange={(e) => updateField("staircase", e.target.value)}
                            placeholder="A, B…"
                          />
                        </div>
                        <div>
                          <Label htmlFor="floor" className="text-xs">Piso</Label>
                          <Input
                            id="floor"
                            value={form.floor}
                            onChange={(e) => updateField("floor", e.target.value)}
                            placeholder="1º, 2º…"
                          />
                        </div>
                        <div>
                          <Label htmlFor="door" className="text-xs">Puerta</Label>
                          <Input
                            id="door"
                            value={form.door}
                            onChange={(e) => updateField("door", e.target.value)}
                            placeholder="1, 2ª…"
                          />
                        </div>
                      </div>

                      {/* Delivery min / out of range warnings */}
                      {deliveryOutOfRange && (
                        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm mt-4">
                          <p className="font-display font-bold text-destructive flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            Fuera de zona de reparto
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Tu dirección está a {deliveryMin?.distanceKm.toFixed(1)} km de
                            nuestra pizzería más cercana. Solo entregamos hasta{" "}
                            {deliveryMin?.maxKmConfigured.toFixed(1)} km.
                          </p>
                        </div>
                      )}
                      {!deliveryOutOfRange && deliveryBelowMin && deliveryMin?.minOrderAmount != null && (
                        <div className="rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm mt-4">
                          <p className="font-display font-bold text-foreground flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-menu-teal" />
                            Pedido mínimo: {deliveryMin.minOrderAmount.toFixed(2)} €
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Te faltan{" "}
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              {(deliveryMin.minOrderAmount - totalPrice).toFixed(2)} €
                            </span>{" "}
                            para llegar al mínimo.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-menu-teal/30 bg-menu-teal/5 p-4">
                      <div className="flex items-start gap-3">
                        <Store className="w-5 h-5 text-menu-teal shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-sm text-foreground">
                            Recogida en local
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {form.pickupStore
                              ? locationsData[form.pickupStore as keyof typeof locationsData]?.name ?? form.pickupStore
                              : "Sin local seleccionado"}
                          </p>
                          {form.pickupStore && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {locationsData[form.pickupStore as keyof typeof locationsData]?.address}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => orderFlow.openDialog()}
                          className="text-xs font-display font-bold text-menu-teal hover:underline shrink-0"
                        >
                          Cambiar
                        </button>
                      </div>
                      {errors.pickupStore && (
                        <p className="text-destructive text-xs mt-2">{errors.pickupStore}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  {t("checkout.notesTitle")}
                </h2>
                <Textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder={t("checkout.notesPlaceholder")}
                  maxLength={500}
                  rows={3}
                />
              </div>



              {/* Payment */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  {t("checkout.paymentMethod")}
                </h2>
                <RadioGroup
                  value={form.paymentMethod}
                  onValueChange={(v) => updateField("paymentMethod", v)}
                  className="grid sm:grid-cols-2 gap-3"
                >
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      form.orderType === "delivery"
                        ? "border-border opacity-50 cursor-not-allowed bg-muted/30"
                        : form.paymentMethod === "cash"
                          ? "border-menu-teal bg-menu-teal/5 cursor-pointer"
                          : "border-border hover:border-menu-teal/30 cursor-pointer"
                    }`}
                  >
                    <RadioGroupItem value="cash" disabled={form.orderType === "delivery"} />
                    <Banknote className="w-5 h-5 text-menu-teal" />
                    <div>
                      <p className="font-display font-bold text-sm">
                        {t("checkout.cashPayment")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {form.orderType === "delivery"
                          ? "No disponible para entregas a domicilio"
                          : t("checkout.cashPaymentDesc")}
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      form.paymentMethod === "stripe"
                        ? "border-menu-teal bg-menu-teal/5"
                        : "border-border hover:border-menu-teal/30"
                    }`}
                  >
                    <RadioGroupItem value="stripe" />
                    <CreditCard className="w-5 h-5 text-menu-teal" />
                    <div>
                      <p className="font-display font-bold text-sm">
                        {t("checkout.onlinePayment")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("checkout.onlinePaymentDesc")}
                      </p>
                    </div>
                  </label>
                </RadioGroup>

                {/* Stripe Card Element */}
                {form.paymentMethod === "stripe" && (
                  <div className="mt-4">
                    <Label>{t("checkout.cardDetails")}</Label>
                    <div className="mt-1 rounded-md border border-input bg-background px-3 py-3">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: "14px",
                              color: "hsl(var(--foreground))",
                              "::placeholder": {
                                color: "hsl(var(--muted-foreground))",
                              },
                              fontFamily: "inherit",
                            },
                            invalid: {
                              color: "hsl(var(--destructive))",
                            },
                          },
                          hidePostalCode: true,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      {t("checkout.stripeSecure")}
                    </p>
                  </div>
                )}
              </div>


              {/* Discount / coupon */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 font-display font-bold text-sm">
                  <Tag className="w-4 h-4" /> {t("checkout.discount.title")}
                </div>
                {discount.applied ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/8 border border-primary/20 px-3 py-2">
                    <div className="text-sm">
                      <span className="font-bold text-primary">{discount.applied.code}</span>
                      <span className="text-muted-foreground ml-2">
                        −{discount.applied.discount_amount.toFixed(2)} €
                        {" · "}
                        {discount.applied.manual ? t("checkout.discount.appliedManual") : t("checkout.discount.appliedAuto")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={discount.clear}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={t("checkout.discount.remove")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-body">{t("checkout.discount.haveCode")}</p>
                    <div className="flex gap-2">
                      <Input
                        value={discount.code}
                        onChange={(e) => discount.setCode(e.target.value.toUpperCase())}
                        placeholder={t("checkout.discount.placeholder")}
                        className="font-body uppercase"
                        maxLength={32}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => discount.apply(discount.code)}
                        disabled={discount.loading || !discount.code.trim()}
                        className="font-body shrink-0"
                      >
                        {discount.loading ? "…" : t("checkout.discount.apply")}
                      </Button>
                    </div>
                    {discount.error && (
                      <p className="text-xs text-destructive font-body">
                        {t(`checkout.discount.errors.${discount.error as DiscountReason}`)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  loading ||
                  (form.paymentMethod === "stripe" && !stripe) ||
                  deliveryOutOfRange ||
                  deliveryBelowMin
                }
                className="w-full bg-menu-teal hover:bg-menu-teal/90 text-menu-teal-foreground font-display text-lg py-7 min-h-[56px]"
              >
                {loading
                  ? t("checkout.processing")
                  : deliveryOutOfRange
                    ? "Fuera de zona de reparto"
                    : deliveryBelowMin && deliveryMin?.minOrderAmount != null
                      ? `Pedido mínimo ${deliveryMin.minOrderAmount.toFixed(2)} €`
                      : `${t("checkout.confirmOrder")} · ${finalTotal.toFixed(2)} €`}
              </Button>
            </form>

            {/* Order summary sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border sticky top-28 overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {t("checkout.yourOrder")}
                  </h2>
                </div>

                <div className="divide-y divide-border">
                  {items.map((item) => {
                    const extrasPrice = (item.extras || []).reduce(
                      (s, e) => s + e.price * e.quantity,
                      0,
                    );
                    const lineTotal = item.price * item.quantity + extrasPrice;
                    return (
                      <div key={item.id} className="px-5 py-4">
                        {/* Name row */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* qty badge */}
                            <span className="shrink-0 w-5 h-5 rounded-full bg-menu-teal text-menu-teal-foreground text-[10px] font-bold flex items-center justify-center">
                              {item.quantity}
                            </span>
                            <p className="font-display font-bold text-sm text-foreground leading-tight">
                              {item.name}
                            </p>
                          </div>
                          <span className="font-display font-bold text-sm text-foreground shrink-0">
                            {lineTotal.toFixed(2)} €
                          </span>
                        </div>

                        {/* Base price */}
                        <p className="text-[11px] text-muted-foreground ml-7 mb-1.5">
                          {item.price.toFixed(2)} € / ud
                        </p>

                        {/* Extras */}
                        {(item.extras || []).length > 0 && (
                          <ul className="ml-7 space-y-0.5 mb-1.5">
                            {(item.extras || []).map((extra) => (
                              <li
                                key={extra.id}
                                className="flex items-center justify-between text-[11px] text-muted-foreground"
                              >
                                <span className="flex items-center gap-1">
                                  <span>{extra.emoji}</span>
                                  {extra.quantity > 1 && (
                                    <span className="font-bold">{extra.quantity}×</span>
                                  )}
                                  {extra.label}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {extra.price === 0
                                    ? "Gratis"
                                    : `+${(extra.price * extra.quantity).toFixed(2)} €`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Note */}
                        {item.note && (
                          <p className="ml-7 text-[11px] text-muted-foreground italic">
                            📝 {item.note}
                          </p>
                        )}

                        {/* qty controls + remove */}
                        <div className="flex items-center gap-1.5 mt-2 ml-7">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-colors ml-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-5 py-4 border-t border-border bg-muted/30 space-y-2">
                  {discount.applied && (
                    <>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>{t("checkout.discount.subtotal")}</span>
                        <span>{totalPrice.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-primary font-semibold">
                        <span>{discount.applied.code}</span>
                        <span>−{discount.applied.discount_amount.toFixed(2)} €</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-display font-bold text-base">{t("cart.total")}</span>
                    <span className="font-display text-2xl font-bold text-menu-teal">
                      {finalTotal.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
