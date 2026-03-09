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

        <div className="rounded-lg overflow-hidden border border-border shadow-lg bg-card">
          <iframe
            src="https://pizzeria-lozio.my.canva.site/p"
            title="Menú digital Lo Zio"
            className="w-full border-0"
            style={{ height: "80vh", minHeight: "600px" }}
            loading="lazy"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
