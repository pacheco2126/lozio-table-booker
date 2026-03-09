import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import location1 from "@/assets/location-1.jpg";
import location2 from "@/assets/location-2.jpg";

const locations = [
  {
    id: "tarragona",
    name: "Lo Zio Tarragona",
    address: "Carrer Reding 32, Tarragona",
    phone: "+34 912 345 678",
    hours: "Mar–Dom: 19:00–23:30",
    image: location1,
    alt: "Interior acogedor del restaurante Lo Zio Tarragona",
  },
  {
    id: "arrabassada",
    name: "Lo Zio Arrabassada",
    address: "Carrer Joan Fuster 28, Tarragona",
    phone: "+34 912 876 543",
    hours: "Mié–Mar: 10:00–23:30",
    image: location2,
    alt: "Terraza del restaurante Lo Zio Arrabassada",
  },
];

const ReservationSection = () => {
  const [selectedLocation, setSelectedLocation] = useState(locations[0].id);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loc = locations.find((l) => l.id === selectedLocation);
    
    const { error } = await supabase.from("reservations").insert({
      location: selectedLocation,
      guest_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      reservation_date: formData.date,
      reservation_time: formData.time,
      guests: formData.guests,
      notes: formData.notes || null,
      user_id: (await supabase.auth.getUser()).data.user?.id || null,
    });

    if (error) {
      toast.error("Error al crear la reserva. Inténtalo de nuevo.");
      console.error(error);
      return;
    }

    toast.success(`¡Reserva solicitada en ${loc?.name}!`, {
      description: `${formData.date} a las ${formData.time} para ${formData.guests} personas. Te confirmaremos por email.`,
    });
    setFormData({ name: "", email: "", phone: "", date: "", time: "", guests: "2", notes: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section id="reservar" className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-body uppercase tracking-[0.25em] text-sm mb-3">
            Nuestros locales
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Reserva tu Mesa
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">
            Elige uno de nuestros dos locales y disfruta de la mejor pizza artesanal de la ciudad.
          </p>
        </div>

        {/* Location selector */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`group relative overflow-hidden rounded-lg transition-all duration-300 ${
                selectedLocation === loc.id
                  ? "ring-4 ring-primary shadow-xl scale-[1.02]"
                  : "ring-1 ring-border hover:ring-primary/50"
              }`}
            >
              <img
                src={loc.image}
                alt={loc.alt}
                className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="hero-overlay absolute inset-0" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                <h3 className="font-display text-2xl font-bold text-primary-foreground mb-1">
                  {loc.name}
                </h3>
                <p className="text-primary-foreground/80 font-body text-sm">{loc.address}</p>
                <p className="text-primary-foreground/70 font-body text-sm">{loc.hours}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Reservation form */}
        <div className="max-w-2xl mx-auto bg-card rounded-lg p-8 md:p-12 shadow-lg border border-border">
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            {locations.find((l) => l.id === selectedLocation)?.name}
          </h3>
          <p className="text-muted-foreground font-body mb-8">
            {locations.find((l) => l.id === selectedLocation)?.address} · {locations.find((l) => l.id === selectedLocation)?.phone}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">Nombre *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-sm font-bold text-foreground mb-1.5">Teléfono *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+34 600 000 000"
              />
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">Fecha *</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">Hora *</label>
                <input
                  type="time"
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">Personas *</label>
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                  <option value="10+">Más de 10</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-body text-sm font-bold text-foreground mb-1.5">Notas adicionales</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Alergias, celebraciones especiales, preferencia de mesa..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-4 rounded-sm font-body font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
            >
              Confirmar Reserva
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ReservationSection;
