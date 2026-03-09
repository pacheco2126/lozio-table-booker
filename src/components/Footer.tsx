const Footer = () => {
  return (
    <footer className="bg-foreground py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-display text-3xl font-bold text-background mb-4">Lo Zio</h3>
            <p className="text-background/60 font-body leading-relaxed">
              Auténtica pizza italiana elaborada con ingredientes frescos y la pasión de nuestra familia.
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold text-background mb-4">Lo Zio Centro</h4>
            <p className="text-background/60 font-body text-sm leading-relaxed">
              Calle Mayor 12, Madrid<br />
              +34 912 345 678<br />
              Lun–Dom: 12:00–23:30
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold text-background mb-4">Lo Zio Terraza</h4>
            <p className="text-background/60 font-body text-sm leading-relaxed">
              Paseo de la Castellana 45, Madrid<br />
              +34 912 876 543<br />
              Lun–Dom: 12:00–00:00
            </p>
          </div>
        </div>
        <div className="border-t border-background/20 pt-8 text-center">
          <p className="text-background/40 font-body text-sm">
            © {new Date().getFullYear()} Pizzeria Lo Zio. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
