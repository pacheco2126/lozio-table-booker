import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const locations = [
  {
    slug: "tarragona",
    name: "Lo Zio Tarragona",
    type: "Pizzería italiana",
    address: "Carrer Reding 32 Bajos, Tarragona",
    phone: "+34 682 239 035",
    hours: "Miércoles - Lunes 19:00 - 23:30",
    image: "/placeholder.svg",
  },
  {
    slug: "arrabassada",
    name: "Lo Zio Arrabassada",
    type: "Pizzería italiana",
    address: "Carrer Joan Fuster 28, Tarragona",
    phone: "+34 682 239 035",
    hours: "Martes - Domingo 19:00 - 23:30",
    image: "/placeholder.svg",
  },
  {
    slug: "rincon",
    name: "El Rincón de Lo Zio",
    type: "Bar de paninis artesanales",
    address: "Carrer dels Castellers de Tarragona 1",
    phone: "+34 682 239 035",
    hours: "Lunes - Sábado 8:00 - 22:00",
    image: "/placeholder.svg",
  },
];

const Locales = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar forceSolid />
      <div className="pt-24 pb-16 max-w-6xl mx-auto px-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground text-center mb-4">
          Nuestros Locales
        </h1>
        <p className="text-muted-foreground text-center mb-12 max-w-3xl mx-auto px-2 text-sm md:text-base">
          Descubre nuestras pizzerías y locales en Tarragona. Cada uno con su encanto único.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {locations.map((loc) => (
            <Link
              key={loc.slug}
              to={`/locales/${loc.slug}`}
              className="group block rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 relative"
            >
              {loc.slug === "tarragona" && (
                <span className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] md:text-xs font-bold shadow-lg">
                  🏆 Mejor Restaurante JustEat Catalunya
                </span>
              )}
              <div className="aspect-video overflow-hidden">
                <img
                  src={loc.image}
                  alt={`${loc.name} — Pizza artesanal Lo Zio Tarragona`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-1">{loc.name}</h2>
                <p className="text-sm text-primary font-body font-semibold mb-3">{loc.type}</p>
                <div className="flex items-start gap-2 text-muted-foreground text-sm mb-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{loc.address}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{loc.hours}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Locales;
