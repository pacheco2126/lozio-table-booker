import { useState, useRef, useEffect } from "react";
import { UtensilsCrossed, Plus, ShoppingCart, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import pizzaPlaceholder from "@/assets/pizza-placeholder.jpg";
import { useCart } from "@/contexts/CartContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useMedia } from "@/hooks/useMedia";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getAllergenById } from "@/lib/allergens";
import { cn } from "@/lib/utils";

interface MenuItemData {
  name: string;
  desc?: string;
  price: string;
  priceNum: number;
  allergens?: string[];
  category: "pizzas" | "focaccias" | "calzones";
}

const menuItems: MenuItemData[] = [
  // Pizzas
  {
    name: "MARINARA",
    desc: "Tomate, ajo y orégano.",
    price: "9,50 €",
    priceNum: 9.5,
    allergens: ["gluten"],
    category: "pizzas",
  },
  {
    name: "MARGHERITA",
    desc: "Tomate, mozzarella.",
    price: "10,00 €",
    priceNum: 10,
    allergens: ["gluten", "lacteos"],
    category: "pizzas",
  },
  {
    name: "SICILIANA",
    desc: "Tomate, mozzarella, anchoas, alcaparras y olivas.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "pescado", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "FUNGHI",
    desc: "Tomate, mozzarella y champiñones.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos"],
    category: "pizzas",
  },
  {
    name: "GRECA",
    desc: "Tomate, mozzarella y olivas negras.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos"],
    category: "pizzas",
  },
  {
    name: "TEDESCA",
    desc: "Tomate, mozzarella y frankfurt.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "soja", "mostaza", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "PICCANTE",
    desc: "Tomate, mozzarella y chorizo picante.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "mostaza", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "TARRAGONINA",
    desc: "Tomate, mozzarella, jamón y huevo.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "huevo", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "PROSCIUTTO",
    desc: "Tomate, mozzarella y jamón dulce.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "RÚSTICA",
    desc: "Tomate, mozzarella, bacon y cebolla.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "CALABRESE",
    desc: "Tomate, mozzarella y embutido picante de Calabria.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "mostaza", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "TONNARA",
    desc: "Tomate, mozzarella y atún.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "pescado", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "CATALANA",
    desc: "Base carbonara y bacon.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "huevo", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "VEGETARIANA",
    desc: "Tomate, mozzarella, pimiento rojo, calabacín y berenjena.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos"],
    category: "pizzas",
  },
  {
    name: "4 STAGIONI",
    desc: "Tomate, mozzarella, champiñones, jamón dulce, alcachofas y embutido picante.",
    price: "12,00 €",
    priceNum: 12,
    allergens: ["gluten", "lacteos", "mostaza", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "ITALIANA",
    desc: "Tomate, mozzarella búfala, tomate cherry y albahaca.",
    price: "14,00 €",
    priceNum: 14,
    allergens: ["gluten", "lacteos"],
    category: "pizzas",
  },
  {
    name: "CIOCIARA",
    desc: "Mozzarella, longaniza Friarielli y tomate cherry.",
    price: "15,00 €",
    priceNum: 15,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "FANTASÍA",
    desc: "Tomate, mozzarella, y 4 ingredientes a escoger.",
    price: "16,00 €",
    priceNum: 16,
    allergens: ["gluten", "lacteos"],
    category: "pizzas",
  },
  {
    name: "MILANO",
    desc: "Tomate, mozzarella y salami milano.",
    price: "12,00 €",
    priceNum: 12,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "BOSCAIOLA",
    desc: "Tomate, mozzarella, longaniza, champiñones y pimienta negra.",
    price: "13,50 €",
    priceNum: 13.5,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "SPECK",
    desc: "Tomate, mozzarella, jamón ahumado y champiñones.",
    price: "14,00 €",
    priceNum: 14,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "TROPEA",
    desc: "Mozzarella, cebolla roja, tomate natural y albahaca.",
    price: "13,00 €",
    priceNum: 13,
    allergens: ["gluten", "lacteos"],
    category: "pizzas",
  },
  {
    name: "HAWAI",
    desc: "Tomate, mozzarella, piña, maíz y jamón.",
    price: "13,00 €",
    priceNum: 13,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "BRESAOLINA",
    desc: "Tomate, mozzarella, embutido bresaola, rúcula y queso Grana Padano.",
    price: "14,00 €",
    priceNum: 14,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "4 FORMAGGI",
    desc: "Tomate, mozzarella, gorgonzola, fontina, Emmental y queso de cabra.",
    price: "13,50 €",
    priceNum: 13.5,
    allergens: ["gluten", "lacteos"],
    category: "pizzas",
  },
  {
    name: "NORVEGIA",
    desc: "Mozzarella, burrata, salmón ahumado y rúcula.",
    price: "18,50 €",
    priceNum: 18.5,
    allergens: ["gluten", "lacteos", "pescado", "sulfitos"],
    category: "pizzas",
  },
  {
    name: "SALENTINA",
    desc: "Mozzarella, burrata, tomate seco y rúcula.",
    price: "15,50 €",
    priceNum: 15.5,
    allergens: ["gluten", "lacteos"],
    category: "pizzas",
  },
  {
    name: "LOMBARDA",
    desc: "Mozzarella, porchetta, scamorza, tomate cherry.",
    price: "16,00 €",
    priceNum: 16,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "pizzas",
  },
  // Focaccias
  {
    name: "FOCACCIA CRUDO",
    desc: "Aceite, romero, sal y jamón serrano.",
    price: "11,50 €",
    priceNum: 11.5,
    allergens: ["gluten", "sulfitos"],
    category: "focaccias",
  },
  {
    name: "FOCACCIA CAPRESE",
    desc: "Aceite, tomate fresco, mozzarella fresca y albahaca.",
    price: "11,50 €",
    priceNum: 11.5,
    allergens: ["gluten", "lacteos"],
    category: "focaccias",
  },
  {
    name: "LA FOCACCIA DELLO ZIO",
    desc: "Bocconcini di mozzarella, salami picante, sobrasada picante, tomate fresco, aceite, orégano y guindilla.",
    price: "15,00 €",
    priceNum: 15,
    allergens: ["gluten", "lacteos", "mostaza", "sulfitos"],
    category: "focaccias",
  },
  // Calzones
  {
    name: "CALZONE",
    desc: "Tomate, mozzarella y jamón.",
    price: "11,00 €",
    priceNum: 11,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "calzones",
  },
  {
    name: "BIG CALZONE",
    desc: "Tomate, mozzarella, jamón, huevo y verdura.",
    price: "14,00 €",
    priceNum: 14,
    allergens: ["gluten", "lacteos", "huevo", "sulfitos"],
    category: "calzones",
  },
  {
    name: "RUSTICELLA (Calzone)",
    desc: "Tomate, mozzarella, jamón dulce, queso y verduras.",
    price: "15,00 €",
    priceNum: 15,
    allergens: ["gluten", "lacteos", "sulfitos"],
    category: "calzones",
  },
];

const categories = [
  { id: "pizzas" as const, icon: Flame },
  { id: "focaccias" as const, icon: UtensilsCrossed },
  { id: "calzones" as const, icon: UtensilsCrossed },
];

const AllergenBadges = ({ allergens }: { allergens?: string[] }) => {
  if (!allergens?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {allergens.map((id) => {
        const a = getAllergenById(id);
        if (!a) return null;
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full bg-muted cursor-default">
                {a.emoji}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {a.name}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

const MenuCard = ({
  item,
  onAdd,
  showAddButton,
  imageUrl,
}: {
  item: MenuItemData;
  onAdd: () => void;
  showAddButton: boolean;
  imageUrl?: string | null;
}) => {
  const { t } = useTranslation();
  return (
    <div className="group bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden" style={{ paddingBottom: "60%" }}>
        <img
          src={imageUrl || pizzaPlaceholder}
          alt={`Pizza artesanal ${item.name} Lo Zio Tarragona`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      {/* Body */}
      <div className="p-3 md:p-4 flex flex-col flex-1 gap-2">
        <h4 className="font-display font-bold text-foreground text-sm md:text-base leading-tight tracking-wide">
          {item.name}
        </h4>
        {item.desc && (
          <p className="text-muted-foreground text-[11px] md:text-xs leading-relaxed line-clamp-2 flex-1">
            {t(`menu.desc.${item.name}`, item.desc)}
          </p>
        )}
        <AllergenBadges allergens={item.allergens} />
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="font-display font-bold text-primary text-base md:text-lg">{item.price}</span>
        </div>
        {showAddButton && (
          <Button
            onClick={onAdd}
            className="w-full bg-primary text-primary-foreground font-body font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity mt-1"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {t("menu.addToOrder", "Añadir")}
          </Button>
        )}
      </div>
    </div>
  );
};

const MenuSection = () => {
  const { addItem } = useCart();
  const { isAdmin } = useIsAdmin();
  const { t } = useTranslation();
  const { getImageForItem } = useMedia("menu_item");
  const [activeCategory, setActiveCategory] = useState<string>("pizzas");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  const handleAdd = (item: MenuItemData) => {
    addItem({
      id: item.name.toLowerCase().replace(/\s+/g, "-"),
      name: item.name,
      description: item.desc,
      price: item.priceNum,
    });
    toast.success(t("menu.addedToOrder", { name: item.name }));
  };

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    const el = sectionRefs.current[catId];
    if (el) {
      const offset = 140;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      // Update sticky state
      const nav = navRef.current;
      if (nav) {
        const rect = nav.getBoundingClientRect();
        setIsSticky(rect.top <= 64);
      }

      // Update active category based on scroll
      for (const cat of [...categories].reverse()) {
        const el = sectionRefs.current[cat.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categoryLabels: Record<string, string> = {
    pizzas: t("menu.pizzas", "Pizzas"),
    focaccias: t("menu.focaccias", "Focaccias"),
    calzones: t("menu.calzones", "Calzones"),
  };

  return (
    <TooltipProvider delayDuration={200}>
      <section id="menu" className="py-16 md:py-24 px-4 bg-muted pb-24 md:pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-menu-teal font-body uppercase tracking-[0.25em] text-sm mb-3">{t("menu.header")}</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">{t("menu.title")}</h2>
            <p className="font-display text-lg tracking-[0.3em] uppercase text-muted-foreground mb-6">
              {t("menu.location")}
            </p>
          </div>

          {/* Sticky Category Nav */}
          <div
            ref={navRef}
            className={cn(
              "sticky top-[60px] z-30 -mx-4 px-4 py-3 transition-all duration-300 mb-8",
              isSticky ? "bg-muted/95 backdrop-blur-sm shadow-sm" : "",
            )}
          >
            <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-full font-body font-bold text-sm whitespace-nowrap transition-all duration-200 shrink-0",
                      activeCategory === cat.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card text-foreground border border-border hover:border-primary/50",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {categoryLabels[cat.id]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Sections */}
          {categories.map((cat) => {
            const items = menuItems.filter((i) => i.category === cat.id);
            if (!items.length) return null;
            return (
              <div
                key={cat.id}
                ref={(el) => {
                  sectionRefs.current[cat.id] = el;
                }}
                className="mb-16 scroll-mt-40"
              >
                <div className="flex items-center gap-3 mb-6">
                  <cat.icon className="w-6 h-6 text-menu-teal" />
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-menu-teal">
                    {categoryLabels[cat.id]}
                  </h3>
                  <span className="text-muted-foreground font-body text-sm">({items.length})</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                  {items.map((item) => (
                    <MenuCard key={item.name} item={item} onAdd={() => handleAdd(item)} showAddButton={isAdmin} imageUrl={getImageForItem(item.name)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </TooltipProvider>
  );
};

export default MenuSection;
