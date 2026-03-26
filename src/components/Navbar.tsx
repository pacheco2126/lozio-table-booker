import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Menu, X, ChevronDown } from "lucide-react";
import logo_app_inicio from "@/assets/logozio.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const Navbar = ({ forceSolid = false }: { forceSolid?: boolean }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        (forceSolid || scrolled) ? "bg-foreground/95 backdrop-blur-sm py-3 shadow-lg" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src={logo_app_inicio} alt="Lo Zio" className="h-10 w-auto brightness-0 invert" />
        </a>
        <div className="hidden md:flex items-center gap-6">
          <a
            href="/#menu"
            className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest transition-colors"
          >
            {t("nav.menu")}
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest transition-colors flex items-center gap-1 outline-none">
              {t("nav.locations")}
              <ChevronDown className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[200px]">
              <DropdownMenuItem asChild>
                <a href="/locales/tarragona" className="cursor-pointer">Lo Zio Tarragona</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/locales/arrabassada" className="cursor-pointer">Lo Zio Arrabassada</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/locales/rincon" className="cursor-pointer">El Rincón de Lo Zio</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <a
            href="/#reservar"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-sm font-body font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            {t("nav.reserve")}
          </a>
          {isAdmin && (
            <a
              href="/admin"
              className="bg-accent text-accent-foreground px-4 py-2 rounded-sm font-body font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <span>Admin</span>
            </a>
          )}
          <a
            href={user ? "/perfil" : "/auth"}
            className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest transition-colors"
          >
            {user ? t("nav.profile") : t("nav.login")}
          </a>
          <LanguageSwitcher />
        </div>
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="landscape-hamburger text-primary-foreground p-1"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="landscape-dropdown md:hidden bg-foreground/95 backdrop-blur-sm border-t border-border px-4 py-3 flex flex-wrap gap-4">
          <a
            href="/#menu"
            onClick={() => setMenuOpen(false)}
            className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest"
          >
            {t("nav.menu")}
          </a>
          <a
            href="/#reservar"
            onClick={() => setMenuOpen(false)}
            className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest"
          >
            {t("nav.reserve")}
          </a>
          <a
            href="/pedido"
            onClick={() => setMenuOpen(false)}
            className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest"
          >
            {t("nav.order")}
          </a>
          {isAdmin && (
            <a
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="text-accent font-body text-sm uppercase tracking-widest font-bold"
            >
              Admin
            </a>
          )}
          <a
            href={user ? "/perfil" : "/auth"}
            onClick={() => setMenuOpen(false)}
            className="text-primary-foreground/80 hover:text-primary-foreground font-body text-sm uppercase tracking-widest"
          >
            {user ? t("nav.profile") : t("nav.login")}
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
