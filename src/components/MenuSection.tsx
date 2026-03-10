import { ExternalLink } from "lucide-react";

const MenuSection = () => {
  return (
    <section id="menu" className="py-24 px-4 bg-muted">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary font-body uppercase tracking-[0.25em] text-sm mb-3">
            Descubre nuestros platos
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Menú Digital
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">
            Consulta nuestra carta completa con todas las pizzas, entrantes y bebidas.
          </p>
        </div>

        <div className="flex justify-center">
          <a
            href="https://pizzeria-lozio.my.canva.site/p"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-10 py-5 rounded-lg font-display text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Ver nuestra carta completa
            <ExternalLink className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
