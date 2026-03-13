import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const timeSlots = [
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00",
];

const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface Props {
  onCreated: () => void;
}

const AdminManualReservation = ({ onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    location: "tarragona",
    guest_name: "",
    email: "",
    phone: "",
    guests: "2",
    time: "20:00",
    notes: "",
    source: "phone",
  });
  const [date, setDate] = useState<Date>(new Date());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guest_name.trim() || !form.phone.trim()) {
      toast.error("Nombre y teléfono son obligatorios");
      return;
    }

    setSubmitting(true);

    const sourceNote = `[Reserva manual - ${form.source === "phone" ? "Llamada" : form.source === "walkin" ? "Walk-in" : "Otra vía"}]`;
    const fullNotes = form.notes ? `${sourceNote} ${form.notes}` : sourceNote;

    const { error } = await supabase.from("reservations").insert({
      location: form.location,
      guest_name: form.guest_name,
      email: form.email || "manual@reserva.local",
      phone: form.phone,
      reservation_date: format(date, "yyyy-MM-dd"),
      reservation_time: form.time,
      guests: form.guests,
      notes: fullNotes,
      status: "confirmed",
      user_id: null,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Error al crear la reserva");
      console.error(error);
      return;
    }

    toast.success("Reserva manual creada correctamente");
    setForm({ location: "tarragona", guest_name: "", email: "", phone: "", guests: "2", time: "20:00", notes: "", source: "phone" });
    setDate(new Date());
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Reserva Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nueva Reserva Manual</DialogTitle>
          <p className="text-muted-foreground font-body text-sm">Para reservas por llamada, walk-in u otras vías</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Source */}
          <div>
            <label className="block font-body text-sm font-bold text-foreground mb-1.5">Vía de reserva</label>
            <select name="source" value={form.source} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="phone">📞 Llamada telefónica</option>
              <option value="walkin">🚶 Walk-in</option>
              <option value="other">📝 Otra vía</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block font-body text-sm font-bold text-foreground mb-1.5">Local *</label>
            <select name="location" value={form.location} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="tarragona">Lo Zio Tarragona</option>
              <option value="arrabassada">Lo Zio Arrabassada</option>
            </select>
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-body text-sm font-bold text-foreground mb-1.5">Fecha *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal font-body text-sm")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "EEE d MMM", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    locale={es}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block font-body text-sm font-bold text-foreground mb-1.5">Hora *</label>
              <select name="time" value={form.time} onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {timeSlots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Guests */}
          <div>
            <label className="block font-body text-sm font-bold text-foreground mb-1.5">Personas *</label>
            <select name="guests" value={form.guests} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {guestOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
              <option value="10+">+10</option>
            </select>
          </div>

          {/* Name & Phone (required) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-body text-sm font-bold text-foreground mb-1.5">Nombre *</label>
              <input type="text" name="guest_name" required value={form.guest_name} onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nombre del cliente" />
            </div>
            <div>
              <label className="block font-body text-sm font-bold text-foreground mb-1.5">Teléfono *</label>
              <input type="tel" name="phone" required value={form.phone} onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+34 600 000 000" />
            </div>
          </div>

          {/* Email (optional) */}
          <div>
            <label className="block font-body text-sm font-bold text-foreground mb-1.5">Email <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="cliente@email.com" />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-body text-sm font-bold text-foreground mb-1.5">Notas</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Alergias, celebraciones, preferencia de mesa..." />
          </div>

          <Button type="submit" disabled={submitting} className="w-full font-bold uppercase tracking-widest">
            {submitting ? "Creando..." : "Crear Reserva"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminManualReservation;
