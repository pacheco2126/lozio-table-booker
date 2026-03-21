import { useTranslation } from "react-i18next";
import heroPizza from "@/assets/hero-pizza.jpg";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden hero-section">
      <img
        src={heroPizza}
        alt="Pizza artesanal italiana con mozzarella fresca y albahaca"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="hero-overlay absolute inset-0" />
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto hero-content">
        <p className="text-primary-foreground/80 font-body text-lg tracking-[0.3em] uppercase mb-4 animate-fade-in-up">
          {t("hero.subtitle")}
        </p>
        <h1 className="font-display text-4xl sm:text-6xl md:text-8xl font-bold text-primary-foreground mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {t("hero.title")}
        </h1>
        <p className="text-primary-foreground/90 font-body text-xl md:text-2xl font-light mb-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {t("hero.description")}
        </p>
        <p className="text-primary-foreground/70 font-body text-base md:text-lg italic mb-10 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          "La vita è un brivido che vola via... è tutto un equilibrio sopra la follia..."
        </p>
        <a
          href="#reservar"
          className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-sm font-body font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          {t("hero.cta")}
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
