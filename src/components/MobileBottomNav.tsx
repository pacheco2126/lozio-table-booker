import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { UtensilsCrossed, CalendarDays, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { totalItems } = useCart();

  const isHome = location.pathname === "/";

  const tabs = [
    { label: t("nav.menu"), icon: UtensilsCrossed, href: "/#menu" },
    { label: t("nav.reserve"), icon: CalendarDays, href: "/#reservar" },
    { label: t("nav.order"), icon: ShoppingCart, href: "/pedido", badge: totalItems },
    { label: t("nav.profile"), icon: User, href: "/perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border md:hidden landscape-hide-bottom-nav">
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            (tab.href === "/perfil" && location.pathname === "/perfil") ||
            (tab.href === "/pedido" && location.pathname === "/pedido");

          return (
            <a
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 px-3 min-h-[56px] flex-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-body font-medium leading-tight">
                {tab.label}
              </span>
            </a>
          );
        })}
      </div>
      {/* Safe area spacing for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default MobileBottomNav;
