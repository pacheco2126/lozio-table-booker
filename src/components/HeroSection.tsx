import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, Bike } from "lucide-react";
import heroPizza from "@/assets/hero-pizza.jpg";
import logoZio from "@/assets/logozio.png";

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const scrollToReservation = () => {
    const el = document.getElementById("reservar");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden hero-section">
      {/* Background */}
      <img
        src={heroPizza}
        alt="Pizza artesanal italiana"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-foreground/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 px-5 pt-24 pb-24 md:pb-12 max-w-5xl mx-auto w-full">
        {/* Logo + Tagline */}
        <div className="text-center mb-auto">
          <img
            src={logoZio}
            alt="Lo Zio"
            className="h-16 md:h-20 w-auto mx-auto brightness-0 invert mb-4 animate-fade-in-up"
          />
          <p
            className="text-primary-foreground/60 font-display italic text-base md:text-lg tracking-wide animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            "La vita è un brivido che vola via..."
          </p>
        </div>

        {/* Action Cards */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mt-auto md:mt-auto md:mb-8">
          {/* Reservar Mesa */}
          <button
            onClick={scrollToReservation}
            className="group relative flex-1 rounded-xl overflow-hidden border border-primary-foreground/20 backdrop-blur-sm bg-foreground/40 hover:bg-foreground/50 transition-all duration-300 min-h-[140px] md:min-h-[200px] animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
              <UtensilsCrossed className="w-10 h-10 md:w-12 md:h-12 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-1">
                {t("hero.cta")}
              </h2>
              <p className="text-primary-foreground/60 text-sm font-body">
                {t("hero.reserveSubtitle", "Elige local, fecha y hora")}
              </p>
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/40 rounded-xl transition-colors" />
          </button>

          {/* Pedir a Domicilio */}
          <button
            onClick={() => {
              const el = document.getElementById("menu");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="group relative flex-1 rounded-xl overflow-hidden border border-primary-foreground/20 backdrop-blur-sm bg-foreground/40 hover:bg-foreground/50 transition-all duration-300 min-h-[140px] md:min-h-[200px] animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
              <Bike className="w-10 h-10 md:w-12 md:h-12 text-accent mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-1">
                {t("hero.orderCta", "Pedir a Domicilio")}
              </h2>
              <p className="text-primary-foreground/60 text-sm font-body">
                {t("hero.orderSubtitle", "Ver carta y hacer tu pedido")}
              </p>
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/40 rounded-xl transition-colors" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
