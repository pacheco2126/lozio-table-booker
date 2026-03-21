import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es, enUS, ca } from "date-fns/locale";
import { toast } from "sonner";
import { AlertTriangle, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUnavailableSlots, tablesNeeded, TABLES_PER_LOCATION, TABLE_CAPACITY } from "@/lib/availability";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import location1 from "@/assets/location-1.jpg";
import location2 from "@/assets/location-2.jpg";

const timeSlots = [
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00",
];

const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const dateFnsLocales: Record<string, typeof es> = { es, en: enUS, ca };

const ReservationSection = () => {
  const { t, i18n } = useTranslation();
  const dfLocale = dateFnsLocales[i18n.language] || es;
  const [highlight, setHighlight] = useState(false);

  const locations = [
    {
      id: "tarragona",
      name: "Lo Zio Tarragona",
      address: "Carrer Reding 32, Tarragona",
      phone: "+34 912 345 678",
      hours: t("reservation.locationTarragona.hours"),
      image: location1,
      alt: "Interior acogedor del restaurante Lo Zio Tarragona",
      timeSlots,
    },
    {
      id: "arrabassada",
      name: "Lo Zio Arrabassada",
      address: "Carrer Joan Fuster 28, Tarragona",
      phone: "+34 912 876 543",
      hours: t("reservation.locationArrabassada.hours"),
      image: location2,
      alt: "Terraza del restaurante Lo Zio Arrabassada",
      timeSlots,
    },
  ];

  const [selectedLocation, setSelectedLocation] = useState(locations[0].id);
  const [guests, setGuests] = useState("2");
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "details">("select");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  const loc = locations.find((l) => l.id === selectedLocation)!;
  const guestsNum = parseInt(guests) || 2;
  const maxGuests = TABLES_PER_LOCATION * TABLE_CAPACITY;

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoadingSlots(true);
      const { data, error } = await supabase
        .from("reservations")
        .select("reservation_time, guests")
        .eq("location", selectedLocation)
        .eq("reservation_date", format(date, "yyyy-MM-dd"))
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
      reservation_date: format(date, "yyyy-MM-dd"),
      reservation_time: selectedTime,
      guests,
      notes: formData.notes || null,
      user_id: (await supabase.auth.getUser()).data.user?.id || null,
    });

    setSubmitting(false);

    if (error) {
      toast.error(t("reservation.error"));
      console.error(error);
      return;
    }

    toast.success(t("reservation.successTitle", { name: loc.name }), {
      description: t("reservation.successDesc", {
        date: format(date, "PPP", { locale: dfLocale }),
        time: selectedTime,
        guests,
      }),
    });
    setFormData({ name: "", email: "", phone: "", notes: "" });
    setSelectedTime(null);
    setStep("select");
  };

  return (
    <section id="reservar" className="py-16 md:py-24 px-4 bg-background pb-24 md:pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-body uppercase tracking-[0.25em] text-sm mb-3">{t("reservation.sectionTitle")}</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">{t("reservation.title")}</h2>
          <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">{t("reservation.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {locations.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setSelectedLocation(l.id); setSelectedTime(null); setStep("select");
                setTimeout(() => {
                  const el = document.getElementById('reservation-form');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setHighlight(true);
                  setTimeout(() => setHighlight(false), 1500);
                }, 100);
              }}
              className={`group relative overflow-hidden rounded-lg transition-all duration-300 ${
                selectedLocation === l.id ? "ring-4 ring-primary shadow-xl scale-[1.02]" : "ring-1 ring-border hover:ring-primary/50"
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

        <div className="max-w-xl mx-auto bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="text-center pt-8 pb-2 px-6">
            <h3 className="font-display text-2xl font-bold text-foreground">{loc.name}</h3>
            <p className="text-muted-foreground font-body text-sm mt-1">{t("reservation.pizzeria")}</p>
          </div>

          {step === "select" ? (
            <div className="px-6 pb-8">
              <div className="grid grid-cols-2 gap-3 py-6">
                <div>
                  <label className="block font-body text-xs text-muted-foreground mb-1.5">{t("reservation.guests")}</label>
                  <select value={guests} onChange={(e) => setGuests(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {guestOptions.map((n) => (<option key={n} value={n}>{n}</option>))}
                    <option value="10+">+10</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-xs text-muted-foreground mb-1.5">{t("reservation.date")}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal font-body text-sm", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(date, "EEE d MMM", { locale: dfLocale })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)}
                        disabled={(d) => { const today = new Date(); today.setHours(0,0,0,0); const maxDate = new Date(today); maxDate.setDate(today.getDate() + 30); return d < today || d > maxDate; }}
                        locale={dfLocale} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 mb-4">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200 font-body text-sm" dangerouslySetInnerHTML={{ __html: t("reservation.durationWarning") }} />
              </Alert>

              <div className="border-t border-border my-2" />

              <div className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-body text-sm text-muted-foreground">{t("reservation.selectTime")}</p>
                  {loadingSlots && <span className="font-body text-xs text-muted-foreground animate-pulse">{t("reservation.checkingAvailability")}</span>}
                </div>
                {tablesNeeded(guestsNum) > TABLES_PER_LOCATION ? (
                  <p className="font-body text-sm text-destructive text-center py-4">{t("reservation.maxGuestsError", { max: maxGuests })}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => {
                      const isUnavailable = unavailableSlots.has(slot);
                      return (
                        <button key={slot} onClick={() => handleTimeSelect(slot)} disabled={isUnavailable}
                          className={`py-3.5 px-3 rounded-lg font-body text-sm font-medium transition-all duration-200 min-h-[44px] ${
                            isUnavailable ? "bg-muted/50 text-muted-foreground/40 cursor-not-allowed line-through" : "bg-muted text-foreground hover:bg-primary/10 hover:text-primary hover:ring-2 hover:ring-primary/30"
                          }`}>{slot}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 pb-8">
              <div className="flex items-center gap-3 py-6 border-b border-border mb-6">
                <button type="button" onClick={handleBack} className="text-primary hover:text-primary/80 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="font-body text-sm text-foreground">
                  <span className="font-bold">{selectedTime}</span>
                  <span className="text-muted-foreground mx-1.5">·</span>
                  <span>{format(date, "EEE d MMM", { locale: dfLocale })}</span>
                  <span className="text-muted-foreground mx-1.5">·</span>
                  <span>{guests} {parseInt(guests) === 1 ? t("reservation.person") : t("reservation.persons")}</span>
                </div>
              </div>

              <div className="space-y-4 landscape-form-grid">
                <div>
                  <label className="block font-body text-sm font-bold text-foreground mb-1.5">{t("reservation.name")} *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t("reservation.name")} />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block font-body text-sm font-bold text-foreground mb-1.5">{t("reservation.email")} *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange}
                      className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-bold text-foreground mb-1.5">{t("reservation.phone")} *</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                      className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="+34 600 000 000" />
                  </div>
                </div>
                <div>
                  <label className="block font-body text-sm font-bold text-foreground mb-1.5">{t("reservation.notes")}</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder={t("reservation.notesPlaceholder")} />
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full mt-6 bg-primary text-primary-foreground py-4 min-h-[48px] rounded-lg font-body font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? t("reservation.submitting") : t("reservation.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReservationSection;
