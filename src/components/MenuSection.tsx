import { UtensilsCrossed, Plus, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import pizzaPlaceholder from "@/assets/pizza-placeholder.png";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getAllergenById } from "@/lib/allergens";

interface MenuItemData {
  name: string;
  desc?: string;
  price: string;
  priceNum: number;
  allergens?: string[];
}

const pizzas: MenuItemData[] = [
  { name: "MARINARA", desc: "Tomate, ajo y orégano.", price: "9,50 €", priceNum: 9.5, allergens: ["gluten"] },
  { name: "MARGHERITA", desc: "Tomate, mozzarella.", price: "10,00 €", priceNum: 10, allergens: ["gluten", "lacteos"] },
  { name: "SICILIANA", desc: "Tomate, mozzarella, anchoas, alcaparras y olivas.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "pescado", "sulfitos"] },
  { name: "FUNGHI", desc: "Tomate, mozzarella y champiñones.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos"] },
  { name: "GRECA", desc: "Tomate, mozzarella y olivas negras.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos"] },
  { name: "TEDESCA", desc: "Tomate, mozzarella y frankfurt.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "soja", "mostaza", "sulfitos"] },
  { name: "PICCANTE", desc: "Tomate, mozzarella y chorizo picante.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "mostaza", "sulfitos"] },
  { name: "TARRAGONINA", desc: "Tomate, mozzarella, jamón y huevo.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "huevo", "sulfitos"] },
  { name: "PROSCIUTTO", desc: "Tomate, mozzarella y jamón dulce.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "RÚSTICA", desc: "Tomate, mozzarella, bacon y cebolla.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "CALABRESE", desc: "Tomate, mozzarella y embutido picante de Calabria.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "mostaza", "sulfitos"] },
  { name: "TONNARA", desc: "Tomate, mozzarella y atún.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "pescado", "sulfitos"] },
  { name: "CATALANA", desc: "Base carbonara y bacon.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "huevo", "sulfitos"] },
  { name: "VEGETARIANA", desc: "Tomate, mozzarella, pimiento rojo, calabacín y berenjena.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos"] },
  { name: "4 STAGIONI", desc: "Tomate, mozzarella, champiñones, jamón dulce, alcachofas y embutido picante.", price: "12,00 €", priceNum: 12, allergens: ["gluten", "lacteos", "mostaza", "sulfitos"] },
  { name: "ITALIANA", desc: "Tomate, mozzarella búfala, tomate cherry y albahaca.", price: "14,00 €", priceNum: 14, allergens: ["gluten", "lacteos"] },
  { name: "CIOCIARA", desc: "Mozzarella, longaniza Friarielli y tomate cherry.", price: "15,00 €", priceNum: 15, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "FANTASÍA", desc: "Tomate, mozzarella, y 4 ingredientes a escoger.", price: "16,00 €", priceNum: 16, allergens: ["gluten", "lacteos"] },
  { name: "MILANO", desc: "Tomate, mozzarella y salami milano.", price: "12,00 €", priceNum: 12, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "BOSCAIOLA", desc: "Tomate, mozzarella, longaniza, champiñones y pimienta negra.", price: "13,50 €", priceNum: 13.5, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "SPECK", desc: "Tomate, mozzarella, jamón ahumado y champiñones.", price: "14,00 €", priceNum: 14, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "TROPEA", desc: "Mozzarella, cebolla roja, tomate natural y albahaca.", price: "13,00 €", priceNum: 13, allergens: ["gluten", "lacteos"] },
  { name: "HAWAI", desc: "Tomate, mozzarella, piña, maíz y jamón.", price: "13,00 €", priceNum: 13, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "BRESAOLINA", desc: "Tomate, mozzarella, embutido bresaola, rúcula y queso Grana Padano.", price: "14,00 €", priceNum: 14, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "4 FORMAGGI", desc: "Tomate, mozzarella, gorgonzola, fontina, Emmental y queso de cabra.", price: "13,50 €", priceNum: 13.5, allergens: ["gluten", "lacteos"] },
  { name: "FOCACCIA CRUDO", desc: "Aceite, romero, sal y jamón serrano.", price: "11,50 €", priceNum: 11.5, allergens: ["gluten", "sulfitos"] },
  { name: "FOCACCIA CAPRESE", desc: "Aceite, tomate fresco, mozzarella fresca y albahaca.", price: "11,50 €", priceNum: 11.5, allergens: ["gluten", "lacteos"] },
  { name: "LA FOCACCIA DELLO ZIO", desc: "Bocconcini di mozzarella, salami picante, sobrasada picante, tomate fresco, aceite, orégano y guindilla.", price: "15,00 €", priceNum: 15, allergens: ["gluten", "lacteos", "mostaza", "sulfitos"] },
  { name: "SALENTINA", desc: "Mozzarella, burrata, tomate seco y rúcula.", price: "15,50 €", priceNum: 15.5, allergens: ["gluten", "lacteos"] },
  { name: "LOMBARDA", desc: "Mozzarella, porchetta, scamorza, tomate cherry.", price: "16,00 €", priceNum: 16, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "CALZONE", desc: "Tomate, mozzarella y jamón.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "BIG CALZONE", desc: "Tomate, mozzarella, jamón, huevo y verdura.", price: "14,00 €", priceNum: 14, allergens: ["gluten", "lacteos", "huevo", "sulfitos"] },
  { name: "RUSTICELLA (Calzone)", desc: "Tomate, mozzarella, jamón dulce, queso y verduras.", price: "15,00 €", priceNum: 15, allergens: ["gluten", "lacteos", "sulfitos"] },
  { name: "NORVEGIA", desc: "Mozzarella, burrata, salmón ahumado y rúcula.", price: "18,50 €", priceNum: 18.5, allergens: ["gluten", "lacteos", "pescado", "sulfitos"] },
];

const AllergenBadges = ({ allergens }: { allergens?: string[] }) => {
  if (!allergens?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {allergens.map((id) => {
        const a = getAllergenById(id);
        if (!a) return null;
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-muted cursor-default">
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

const MenuItem = ({ item, onAdd }: { item: MenuItemData; onAdd: () => void }) => {
  return (
    <div className="group flex items-center gap-3 py-3 border-b border-menu-teal/15 last:border-0 hover:bg-menu-teal/5 px-2 -mx-2 rounded transition-colors">
      {/* Placeholder image */}
      <div className="w-14 h-14 md:w-12 md:h-12 rounded-lg bg-menu-teal/10 shrink-0 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-menu-teal/40">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-display font-bold text-menu-teal text-sm tracking-wide">{item.name}</span>
        {item.desc && <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed line-clamp-2">{item.desc}</p>}
        <AllergenBadges allergens={item.allergens} />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-display font-bold text-foreground text-sm">{item.price}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 md:h-7 md:w-7 border-menu-teal/30 text-menu-teal hover:bg-menu-teal hover:text-menu-teal-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </Button>
      </div>
    </div>
  );
};

const MenuSection = () => {
  const { addItem } = useCart();
  const { t } = useTranslation();

  const half = Math.ceil(pizzas.length / 2);
  const col1 = pizzas.slice(0, half);
  const col2 = pizzas.slice(half);

  const handleAdd = (item: MenuItemData) => {
    addItem({
      id: item.name.toLowerCase().replace(/\s+/g, "-"),
      name: item.name,
      description: item.desc,
      price: item.priceNum,
    });
    toast.success(t("menu.addedToOrder", { name: item.name }));
  };

  return (
    <TooltipProvider delayDuration={200}>
      <section id="menu" className="py-16 md:py-24 px-4 bg-muted pb-24 md:pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-menu-teal font-body uppercase tracking-[0.25em] text-sm mb-3">
              {t("menu.header")}
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
              {t("menu.title")}
            </h2>
            <p className="font-display text-lg tracking-[0.3em] uppercase text-muted-foreground mb-6">
              {t("menu.location")}
            </p>
            <div className="inline-flex items-center gap-2 bg-menu-teal/10 text-menu-teal px-4 py-2 rounded-full text-sm font-body">
              <ShoppingCart className="w-4 h-4" />
              {t("menu.cartHint")}
            </div>
          </div>

          {/* Pizzas */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <UtensilsCrossed className="w-6 h-6 text-menu-teal" />
              <h3 className="font-display text-3xl font-bold text-menu-teal">{t("menu.pizzas")}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-0">
              <div>
                {col1.map((item) => (
                  <MenuItem key={item.name} item={item} onAdd={() => handleAdd(item)} />
                ))}
              </div>
              <div>
                {col2.map((item) => (
                  <MenuItem key={item.name} item={item} onAdd={() => handleAdd(item)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default MenuSection;
