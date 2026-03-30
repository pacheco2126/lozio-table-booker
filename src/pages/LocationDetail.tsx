import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMedia } from "@/hooks/useMedia";

interface LocationData {
  slug: string;
  name: string;
  type: string;
  address: string;
  street: string;
  city: string;
  postalCode: string;
  phone: string;
  hours: string;
  hoursSpec: { dayOfWeek: string[]; opens: string; closes: string }[];
  description: string;
  h1: string;
  mapEmbed: string;
  image: string;
}

const locationsData: Record<string, LocationData> = {
  tarragona: {
    slug: "tarragona",
    name: "Lo Zio Tarragona",
    type: "Pizzería italiana",
    address: "Carrer Reding 32 Bajos, Tarragona",
    street: "Carrer Reding 32 Bajos",
    city: "Tarragona",
    postalCode: "43001",
    phone: "+34 682 239 035",
    hours: "Miércoles - Lunes 19:00 - 23:30",
    hoursSpec: [
      { dayOfWeek: ["Monday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "19:00", closes: "23:30" },
    ],
    description:
      "Lo Zio Tarragona es nuestra pizzería artesanal ubicada en el corazón de Tarragona, en Carrer Reding. Disfruta de auténtica pizza italiana elaborada con ingredientes frescos en un ambiente acogedor en el barrio del Serrallo.",
    h1: "Lo Zio Tarragona — Pizzería en Carrer Reding",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3019.8!2d1.2456!3d41.1167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sCarrer+Reding+32+Tarragona!5e0!3m2!1ses!2ses",
    image: "/placeholder.svg",
  },
  arrabassada: {
    slug: "arrabassada",
    name: "Lo Zio Arrabassada",
    type: "Pizzería italiana",
    address: "Carrer Joan Fuster 28, Tarragona",
    street: "Carrer Joan Fuster 28",
    city: "Tarragona",
    postalCode: "43007",
    phone: "+34 682 239 035",
    hours: "Martes - Domingo 19:00 - 23:30",
    hoursSpec: [
      { dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "19:00", closes: "23:30" },
    ],
    description:
      "Lo Zio Arrabassada se encuentra en la zona residencial de l'Arrabassada, en Carrer Joan Fuster. Un espacio familiar donde saborear nuestras pizzas artesanales con vistas a Tarragona.",
    h1: "Lo Zio Arrabassada — Pizzería en Carrer Joan Fuster",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3019.8!2d1.2656!3d41.1267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sCarrer+Joan+Fuster+28+Tarragona!5e0!3m2!1ses!2ses",
    image: "/placeholder.svg",
  },
  rincon: {
    slug: "rincon",
    name: "El Rincón de Lo Zio",
    type: "Bar de paninis artesanales",
    address: "Carrer dels Castellers de Tarragona 1, Tarragona",
    street: "Carrer dels Castellers de Tarragona 1",
    city: "Tarragona",
    postalCode: "43003",
    phone: "+34 682 239 035",
    hours: "Lunes - Sábado 8:00 - 22:00",
    hoursSpec: [
      { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "08:00", closes: "22:00" },
    ],
    description:
      "El Rincón de Lo Zio es nuestro bar de paninis artesanales en Tarragona, en Carrer dels Castellers. Perfecto para desayunos, almuerzos y meriendas con productos italianos de calidad.",
    h1: "El Rincón de Lo Zio — Bar de Paninis en Tarragona",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3019.8!2d1.2556!3d41.1197!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sCarrer+dels+Castellers+Tarragona!5e0!3m2!1ses!2ses",
    image: "/placeholder.svg",
  },
};

const LocationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = slug ? locationsData[slug] : null;
  const { getImageForItem } = useMedia("location");
  const uploadedImage = slug ? getImageForItem(slug) : null;

  if (!location) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar forceSolid />
        <div className="pt-24 pb-16 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Local no encontrado</h1>
          <Link to="/locales" className="text-primary underline mt-4 inline-block">
            Ver todos los locales
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: location.name,
    description: location.description,
    image: location.image,
    telephone: location.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.street,
      addressLocality: location.city,
      postalCode: location.postalCode,
      addressCountry: "ES",
    },
    servesCuisine: location.type === "Bar de paninis artesanales" ? "Italian, Panini" : "Italian, Pizza",
    priceRange: "€€",
    openingHoursSpecification: location.hoursSpec.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
    url: `https://lozio-table-booker.lovable.app/locales/${location.slug}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${location.name} — ${location.type} en Tarragona`}</title>
        <meta name="description" content={location.description} />
        <link rel="canonical" href={`https://lozio-table-booker.lovable.app/locales/${location.slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Navbar forceSolid />

      <div className="pt-24 pb-16">
        {/* Hero */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={uploadedImage || location.image}
            alt={`Pizza artesanal Lo Zio Tarragona — ${location.name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground text-center px-4">
              {location.h1}
            </h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <p className="text-muted-foreground font-body text-lg leading-relaxed mb-8">
                {location.description}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body font-semibold text-foreground">Dirección</p>
                    <p className="text-muted-foreground">{location.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body font-semibold text-foreground">Teléfono</p>
                    <a href={`tel:${location.phone}`} className="text-primary hover:underline">
                      {location.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body font-semibold text-foreground">Horario</p>
                    <p className="text-muted-foreground">{location.hours}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg">
                  <a href="/#reservar">Reservar Mesa</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/#menu">Ver Menú</a>
                </Button>
              </div>
            </div>

            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-border shadow-sm h-80 lg:h-full min-h-[320px]">
              <iframe
                src={location.mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa de ${location.name}`}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LocationDetail;
