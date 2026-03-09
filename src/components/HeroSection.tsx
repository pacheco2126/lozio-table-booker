import heroPizza from "@/assets/hero-pizza.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      <img
        src={heroPizza}
        alt="Pizza artesanal italiana con mozzarella fresca y albahaca"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="hero-overlay absolute inset-0" />
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <p className="text-primary-foreground/80 font-body text-lg tracking-[0.3em] uppercase mb-4 animate-fade-in-up">
          Auténtica pizza italiana
        </p>
        <h1 className="font-display text-6xl md:text-8xl font-bold text-primary-foreground mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Lo Zio
        </h1>
        <p className="text-primary-foreground/90 font-body text-xl md:text-2xl font-light mb-10 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          Tradición familiar desde el corazón de Italia
        </p>
        <a
          href="#reservar"
          className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-sm font-body font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          Reservar Mesa
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
