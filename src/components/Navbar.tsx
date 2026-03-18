import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import logoZio from "@/assets/logozio.png";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-foreground/95 backdrop-blur-sm py-3 shadow-lg" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src={logoZio} alt="Lo Zio" className="h-10 w-auto brightness-0 invert" />
        </a>
        <div className="flex items-center gap-6">
          <a href="/#menu" className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest transition-colors">
            Menú
          </a>
          <a href="/#reservar" className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest transition-colors">
            Locales
          </a>
          <a
            href="/#reservar"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-sm font-body font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Reservar
          </a>
          <a
            href={user ? "/perfil" : "/auth"}
            className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest transition-colors"
          >
            {user ? "Mi Perfil" : "Iniciar Sesión"}
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
