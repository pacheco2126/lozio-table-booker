import { UtensilsCrossed, Wine, CakeSlice, Plus, ShoppingCart, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { EU_ALLERGENS, getAllergenById } from "@/lib/allergens";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

interface MenuItemData {
  name: string;
  desc?: string;
  price: string;
  priceNum: number;
  allergens?: string[];
  hasExtras?: boolean;
}

interface ExtraOption {
  name: string;
  price: string;
  priceNum: number;
}

const extras: ExtraOption[] = [
  { name: "Verdura", price: "+2,00 €", priceNum: 2 },
  { name: "Embutido / Queso", price: "+3,00 €", priceNum: 3 },
  { name: "Mozzarella de búfala", price: "+5,00 €", priceNum: 5 },
];

const pizzas: MenuItemData[] = [
  { name: "MARINARA", desc: "Tomate, ajo y orégano.", price: "9,50 €", priceNum: 9.5, allergens: ["gluten"], hasExtras: true },
  { name: "MARGHERITA", desc: "Tomate, mozzarella.", price: "10,00 €", priceNum: 10, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "SICILIANA", desc: "Tomate, mozzarella, anchoas, alcaparras y olivas.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "pescado", "sulfitos"], hasExtras: true },
  { name: "FUNGHI", desc: "Tomate, mozzarella y champiñones.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "GRECA", desc: "Tomate, mozzarella y olivas negras.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "TEDESCA", desc: "Tomate, mozzarella y frankfurt.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "soja", "mostaza", "sulfitos"], hasExtras: true },
  { name: "PICCANTE", desc: "Tomate, mozzarella y chorizo picante.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "mostaza", "sulfitos"], hasExtras: true },
  { name: "TARRAGONINA", desc: "Tomate, mozzarella, jamón y huevo.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "huevo", "sulfitos"], hasExtras: true },
  { name: "PROSCIUTTO", desc: "Tomate, mozzarella y jamón dulce.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "RÚSTICA", desc: "Tomate, mozzarella, bacon y cebolla.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "CALABRESE", desc: "Tomate, mozzarella y embutido picante de Calabria.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "mostaza", "sulfitos"], hasExtras: true },
  { name: "TONNARA", desc: "Tomate, mozzarella y atún.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "pescado", "sulfitos"], hasExtras: true },
  { name: "CATALANA", desc: "Base carbonara y bacon.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "huevo", "sulfitos"], hasExtras: true },
  { name: "VEGETARIANA", desc: "Tomate, mozzarella, pimiento rojo, calabacín y berenjena.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "4 STAGIONI", desc: "Tomate, mozzarella, champiñones, jamón dulce, alcachofas y embutido picante.", price: "12,00 €", priceNum: 12, allergens: ["gluten", "lacteos", "mostaza", "sulfitos"], hasExtras: true },
  { name: "ITALIANA", desc: "Tomate, mozzarella búfala, tomate cherry y albahaca.", price: "14,00 €", priceNum: 14, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "CIOCIARA", desc: "Mozzarella, longaniza Friarielli y tomate cherry.", price: "15,00 €", priceNum: 15, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "FANTASÍA", desc: "Tomate, mozzarella, y 4 ingredientes a escoger.", price: "16,00 €", priceNum: 16, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "MILANO", desc: "Tomate, mozzarella y salami milano.", price: "12,00 €", priceNum: 12, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "BOSCAIOLA", desc: "Tomate, mozzarella, longaniza, champiñones y pimienta negra.", price: "13,50 €", priceNum: 13.5, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "SPECK", desc: "Tomate, mozzarella, jamón ahumado y champiñones.", price: "14,00 €", priceNum: 14, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "TROPEA", desc: "Mozzarella, cebolla roja, tomate natural y albahaca.", price: "13,00 €", priceNum: 13, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "HAWAI", desc: "Tomate, mozzarella, piña, maíz y jamón.", price: "13,00 €", priceNum: 13, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "BRESAOLINA", desc: "Tomate, mozzarella, embutido bresaola, rúcula y queso Grana Padano.", price: "14,00 €", priceNum: 14, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "4 FORMAGGI", desc: "Tomate, mozzarella, gorgonzola, fontina, Emmental y queso de cabra.", price: "13,50 €", priceNum: 13.5, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "FOCACCIA CRUDO", desc: "Aceite, romero, sal y jamón serrano.", price: "11,50 €", priceNum: 11.5, allergens: ["gluten", "sulfitos"], hasExtras: true },
  { name: "FOCACCIA CAPRESE", desc: "Aceite, tomate fresco, mozzarella fresca y albahaca.", price: "11,50 €", priceNum: 11.5, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "LA FOCACCIA DELLO ZIO", desc: "Bocconcini di mozzarella, salami picante, sobrasada picante, tomate fresco, aceite, orégano y guindilla.", price: "15,00 €", priceNum: 15, allergens: ["gluten", "lacteos", "mostaza", "sulfitos"], hasExtras: true },
  { name: "SALENTINA", desc: "Mozzarella, burrata, tomate seco y rúcula.", price: "15,50 €", priceNum: 15.5, allergens: ["gluten", "lacteos"], hasExtras: true },
  { name: "LOMBARDA", desc: "Mozzarella, porchetta, scamorza, tomate cherry.", price: "16,00 €", priceNum: 16, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "CALZONE", desc: "Tomate, mozzarella y jamón.", price: "11,00 €", priceNum: 11, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "BIG CALZONE", desc: "Tomate, mozzarella, jamón, huevo y verdura.", price: "14,00 €", priceNum: 14, allergens: ["gluten", "lacteos", "huevo", "sulfitos"], hasExtras: true },
  { name: "RUSTICELLA (Calzone)", desc: "Tomate, mozzarella, jamón dulce, queso y verduras.", price: "15,00 €", priceNum: 15, allergens: ["gluten", "lacteos", "sulfitos"], hasExtras: true },
  { name: "NORVEGIA", desc: "Mozzarella, burrata, salmón ahumado y rúcula.", price: "18,50 €", priceNum: 18.5, allergens: ["gluten", "lacteos", "pescado", "sulfitos"], hasExtras: true },
];

const bebidas: MenuItemData[] = [
  { name: "Caña pequeña", price: "2,50 €", priceNum: 2.5, allergens: ["gluten"] },
  { name: "Caña grande", price: "3,00 €", priceNum: 3, allergens: ["gluten"] },
  { name: "Mediana / Champú / Voll Damm / Sin alcohol", price: "3,00 €", priceNum: 3, allergens: ["gluten"] },
  { name: "Refresco", price: "2,50 €", priceNum: 2.5 },
  { name: "Copa de vino", price: "4,00 €", priceNum: 4, allergens: ["sulfitos"] },
  { name: "Botella vino blanco / Tinto italiano", price: "20,00 €", priceNum: 20, allergens: ["sulfitos"] },
  { name: "Vichy catalán", price: "3,00 €", priceNum: 3 },
  { name: "Agua natural", price: "2,50 €", priceNum: 2.5 },
];

const postres: MenuItemData[] = [
  { name: "Tiramisú", price: "6,00 €", priceNum: 6, allergens: ["gluten", "lacteos", "huevo"] },
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

const PizzaMenuItem = ({ item, onAdd, hidden }: { item: MenuItemData; onAdd: (selectedExtras: ExtraOption[]) => void; hidden?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const { t } = useTranslation();

  if (hidden) return null;

  const toggleExtra = (name: string) => {
    setSelectedExtras((prev) =>
      prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name]
    );
  };

  const handleAdd = () => {
    const chosen = extras.filter((e) => selectedExtras.includes(e.name));
    onAdd(chosen);
    setSelectedExtras([]);
    setExpanded(false);
  };

  const totalExtrasPrice = extras
    .filter((e) => selectedExtras.includes(e.name))
    .reduce((sum, e) => sum + e.priceNum, 0);

  return (
    <div className="py-3 border-b border-menu-teal/15 last:border-0 px-2 -mx-2 rounded transition-colors">
      <div className="group flex justify-between items-start gap-3 hover:bg-menu-teal/5 rounded transition-colors">
        <div className="flex-1 min-w-0">
          <span className="font-display font-bold text-menu-teal text-sm tracking-wide">{item.name}</span>
          {item.desc && <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{item.desc}</p>}
          <AllergenBadges allergens={item.allergens} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-display font-bold text-foreground text-sm">{item.price}</span>
          {item.hasExtras ? (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 md:h-7 md:w-7 border-menu-teal/30 text-menu-teal hover:bg-menu-teal hover:text-menu-teal-foreground transition-opacity"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" />}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 md:h-7 md:w-7 border-menu-teal/30 text-menu-teal hover:bg-menu-teal hover:text-menu-teal-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              onClick={() => onAdd([])}
            >
              <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </Button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-2 ml-1 p-3 bg-card rounded-lg border border-border animate-fade-in">
          <p className="text-xs font-display font-bold text-muted-foreground mb-2">{t("menu.addExtras")}</p>
          <div className="space-y-2">
            {extras.map((extra) => (
              <label key={extra.name} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedExtras.includes(extra.name)}
                  onCheckedChange={() => toggleExtra(extra.name)}
                  className="border-menu-teal/40 data-[state=checked]:bg-menu-teal data-[state=checked]:border-menu-teal"
                />
                <span className="text-xs text-foreground flex-1">{extra.name}</span>
                <span className="text-xs text-muted-foreground">{extra.price}</span>
              </label>
            ))}
          </div>
          <Button
            size="sm"
            className="mt-3 w-full bg-menu-teal hover:bg-menu-teal/90 text-menu-teal-foreground text-xs h-8"
            onClick={handleAdd}
          >
            <Plus className="w-3 h-3 mr-1" />
            {t("menu.addToCart")} — {(item.priceNum + totalExtrasPrice).toFixed(2).replace(".", ",")} €
          </Button>
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ item, onAdd, hidden }: { item: MenuItemData; onAdd: () => void; hidden?: boolean }) => {
  if (hidden) return null;
  return (
    <div className="group flex justify-between items-start gap-3 py-3 border-b border-menu-teal/15 last:border-0 hover:bg-menu-teal/5 px-2 -mx-2 rounded transition-colors">
      <div className="flex-1 min-w-0">
        <span className="font-display font-bold text-menu-teal text-sm tracking-wide">{item.name}</span>
        {item.desc && <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{item.desc}</p>}
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
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);

  const toggleExclude = (id: string) => {
    setExcludedAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const isHidden = (item: MenuItemData) =>
    item.allergens?.some((a) => excludedAllergens.includes(a)) ?? false;

  const half = Math.ceil(pizzas.length / 2);
  const col1 = pizzas.slice(0, half);
  const col2 = pizzas.slice(half);

  const handleAdd = (item: MenuItemData, selectedExtras: ExtraOption[] = []) => {
    const extrasDesc = selectedExtras.length > 0
      ? ` + ${selectedExtras.map((e) => e.name).join(", ")}`
      : "";
    const extrasPrice = selectedExtras.reduce((sum, e) => sum + e.priceNum, 0);
    const itemId = item.name.toLowerCase().replace(/\s+/g, "-") + (extrasDesc ? `-${selectedExtras.map(e => e.name.toLowerCase().replace(/\s+/g, "-")).join("-")}` : "");

    addItem({
      id: itemId,
      name: item.name + extrasDesc,
      description: item.desc,
      price: item.priceNum + extrasPrice,
    });
    toast.success(t("menu.addedToOrder", { name: item.name + extrasDesc }));
  };

  const handleSimpleAdd = (item: MenuItemData) => {
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

          {/* Allergen Filter */}
          <div className="mb-12 p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-menu-teal" />
              <span className="font-display font-bold text-sm text-foreground">{t("menu.filterTitle")}</span>
              <span className="text-xs text-muted-foreground">{t("menu.filterHint")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {EU_ALLERGENS.map((a) => {
                const active = excludedAllergens.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleExclude(a.id)}
                    className={`inline-flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-2 md:py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[36px] md:min-h-0 ${
                      active
                        ? "bg-destructive/15 border-destructive text-destructive"
                        : "bg-muted border-border text-muted-foreground hover:border-menu-teal/40"
                    }`}
                  >
                    <span>{a.emoji}</span>
                    <span>{t(`allergens.${a.id}`)}</span>
                  </button>
                );
              })}
            </div>
            {excludedAllergens.length > 0 && (
              <button
                onClick={() => setExcludedAllergens([])}
                className="mt-3 text-xs text-menu-teal hover:underline"
              >
                {t("menu.clearFilters")}
              </button>
            )}
          </div>

          {/* Pizzas */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <UtensilsCrossed className="w-6 h-6 text-menu-teal" />
              <h3 className="font-display text-3xl font-bold text-menu-teal">{t("menu.pizzas")}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-0">
              <div>
                {col1.map((item) => (
                  <PizzaMenuItem key={item.name} item={item} onAdd={(selExtras) => handleAdd(item, selExtras)} hidden={isHidden(item)} />
                ))}
              </div>
              <div>
                {col2.map((item) => (
                  <PizzaMenuItem key={item.name} item={item} onAdd={(selExtras) => handleAdd(item, selExtras)} hidden={isHidden(item)} />
                ))}
              </div>
            </div>
          </div>

          {/* Bebidas & Postres */}
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Wine className="w-6 h-6 text-menu-teal" />
                <h3 className="font-display text-2xl font-bold text-menu-teal">{t("menu.drinks")}</h3>
              </div>
              {bebidas.map((item) => (
                <MenuItem key={item.name} item={item} onAdd={() => handleSimpleAdd(item)} hidden={isHidden(item)} />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <CakeSlice className="w-6 h-6 text-menu-teal" />
                <h3 className="font-display text-2xl font-bold text-menu-teal">{t("menu.dessert")}</h3>
              </div>
              {postres.map((item) => (
                <MenuItem key={item.name} item={item} onAdd={() => handleSimpleAdd(item)} hidden={isHidden(item)} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default MenuSection;
