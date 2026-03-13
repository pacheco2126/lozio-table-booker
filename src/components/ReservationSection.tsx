import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUnavailableSlots, tablesNeeded, TABLES_PER_LOCATION, TABLE_CAPACITY } from "@/lib/availability";
import location1 from "@/assets/location-1.jpg";
import location2 from "@/assets/location-2.jpg";

const turns = [
  { label: "Turno 1", time: "19:00", range: "19:00 – 20:30" },
  { label: "Turno 2", time: "20:00", range: "20:00 – 22:00" },
  { label: "Turno 3", time: "22:00", range: "22:00 – 23:30" },
];

const locations = [
  {
    id: "tarragona",
    name: "Lo Zio Tarragona",
    address: "Carrer Reding 32, Tarragona",
    phone: "+34 912 345 678",
    hours: "Mar–Dom: 19:00–23:30",
    image: location1,
    alt: "Interior acogedor del restaurante Lo Zio Tarragona",
    timeSlots: turns.map(t => t.time),
  },
  {
    id: "arrabassada",
    name: "Lo Zio Arrabassada",
    address: "Carrer Joan Fuster 28, Tarragona",
    phone: "+34 912 876 543",
    hours: "Mié–Mar: 10:00–23:30",
    image: location2,
    alt: "Terraza del restaurante Lo Zio Arrabassada",
    timeSlots: turns.map(t => t.time),
  },
];

const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getNext7Days(): { label: string; value: string }[] {
  const days: { label: string; value: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const label =
      i === 0
        ? "Hoy"
        : i === 1
        ? "Mañana"
        : d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
    days.push({ label, value });
  }
  return days;
}

const ReservationSection = () => {
  const [selectedLocation, setSelectedLocation] = useState(locations[0].id);
  const [guests, setGuests] = useState("2");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [previewTime, setPreviewTime] = useState("19:00");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "details">("select");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  const dateOptions = useMemo(() => getNext7Days(), []);
  const loc = locations.find((l) => l.id === selectedLocation)!;
  const guestsNum = parseInt(guests) || 2;
  const maxGuests = TABLES_PER_LOCATION * TABLE_CAPACITY;

  // Fetch existing reservations and compute unavailable slots
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoadingSlots(true);
      const { data, error } = await supabase
        .from("reservations")
        .select("reservation_time, guests")
        .eq("location", selectedLocation)
        .eq("reservation_date", date)
        .in("status", ["pending", "confirmed"]);

      if (error) {
        console.error("Error fetching availability:", error);
        setUnavailableSlots(new Set());
      } else {
        const unavailable = getUnavailableSlots(data || [], loc.timeSlots, guestsNum);
        setUnavailableSlots(unavailable);
      }
      setLoadingSlots(false);
    };

    fetchAvailability();
  }, [selectedLocation, date, guests, loc.timeSlots, guestsNum]);

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("details");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedTime(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("reservations").insert({
      location: selectedLocation,
      guest_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      reservation_date: date,
      reservation_time: selectedTime,
      guests,
      notes: formData.notes || null,
      user_id: (await supabase.auth.getUser()).data.user?.id || null,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Error al crear la reserva. Inténtalo de nuevo.");
      console.error(error);
      return;
    }

    toast.success(`¡Reserva confirmada en ${loc.name}!`, {
      description: `${date} a las ${selectedTime} para ${guests} personas.`,
    });
    setFormData({ name: "", email: "", phone: "", notes: "" });
    setSelectedTime(null);
    setStep("select");
  };

  return (
    <section id="reservar" className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-primary font-body uppercase tracking-[0.25em] text-sm mb-3">Nuestros locales</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Reserva tu Mesa</h2>
          <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">
            Elige uno de nuestros dos locales y disfruta de la mejor pizza artesanal.
          </p>
        </div>

        {/* Location cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {locations.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setSelectedLocation(l.id);
                setSelectedTime(null);
                setStep("select");
              }}
              className={`group relative overflow-hidden rounded-lg transition-all duration-300 ${
                selectedLocation === l.id
                  ? "ring-4 ring-primary shadow-xl scale-[1.02]"
                  : "ring-1 ring-border hover:ring-primary/50"
              }`}
            >
              <img src={l.image} alt={l.alt} className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div className="hero-overlay absolute inset-0" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                <h3 className="font-display text-2xl font-bold text-primary-foreground mb-1">{l.name}</h3>
                <p className="text-primary-foreground/80 font-body text-sm">{l.address}</p>
                <p className="text-primary-foreground/70 font-body text-sm">{l.hours}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Booking widget */}
        <div className="max-w-xl mx-auto bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          {/* Location name header */}
          <div className="text-center pt-8 pb-2 px-6">
            <h3 className="font-display text-2xl font-bold text-foreground">{loc.name}</h3>
            <p className="text-muted-foreground font-body text-sm mt-1">Pizzería</p>
          </div>

          {step === "select" ? (
            <div className="px-6 pb-8">
              {/* Party / Date / Time selectors row */}
              <div className="grid grid-cols-3 gap-3 py-6">
                <div>
                  <label className="block font-body text-xs text-muted-foreground mb-1.5">Personas</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {guestOptions.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                    <option value="10+">+10</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-xs text-muted-foreground mb-1.5">Fecha</label>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {dateOptions.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-body text-xs text-muted-foreground mb-1.5">Hora</label>
                  <select
                    value={previewTime}
                    onChange={(e) => setPreviewTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {loc.timeSlots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-2" />

              {/* Time slots grid */}
              <div className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-body text-sm text-muted-foreground">Selecciona una hora disponible</p>
                  {loadingSlots && <span className="font-body text-xs text-muted-foreground animate-pulse">Comprobando disponibilidad...</span>}
                </div>
                {tablesNeeded(guestsNum) > TABLES_PER_LOCATION ? (
                  <p className="font-body text-sm text-destructive text-center py-4">
                    Lo sentimos, no podemos acomodar grupos de más de {maxGuests} personas.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {loc.timeSlots.map((slot) => {
                      const isUnavailable = unavailableSlots.has(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => handleTimeSelect(slot)}
                          disabled={isUnavailable}
                          className={`py-3 px-2 rounded-lg font-body text-sm font-medium transition-all duration-200 ${
                            isUnavailable
                              ? "bg-muted/50 text-muted-foreground/40 cursor-not-allowed line-through"
                              : slot === previewTime
                              ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                              : "bg-muted text-foreground hover:bg-primary/10 hover:text-primary"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Step 2: Contact details form */
            <form onSubmit={handleSubmit} className="px-6 pb-8">
              {/* Back + summary */}
              <div className="flex items-center gap-3 py-6 border-b border-border mb-6">
                <button type="button" onClick={handleBack} className="text-primary hover:text-primary/80 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="font-body text-sm text-foreground">
                  <span className="font-bold">{selectedTime}</span>
                  <span className="text-muted-foreground mx-1.5">·</span>
                  <span>{dateOptions.find((d) => d.value === date)?.label}</span>
                  <span className="text-muted-foreground mx-1.5">·</span>
                  <span>{guests} {parseInt(guests) === 1 ? "persona" : "personas"}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-body text-sm font-bold text-foreground mb-1.5">Nombre *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Tu nombre" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-bold text-foreground mb-1.5">Email *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-bold text-foreground mb-1.5">Teléfono *</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="+34 600 000 000" />
                  </div>
                </div>
                <div>
                  <label className="block font-body text-sm font-bold text-foreground mb-1.5">Notas adicionales</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Alergias, celebraciones, preferencia de mesa..." />
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full mt-6 bg-primary text-primary-foreground py-4 rounded-lg font-body font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? "Reservando..." : "Confirmar Reserva"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReservationSection;
