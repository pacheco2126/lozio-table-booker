import { UtensilsCrossed, Wine, CakeSlice, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface MenuItemData {
  name: string;
  desc?: string;
  price: string;
  priceNum: number;
}

const pizzas: MenuItemData[] = [
  { name: "MARINARA", desc: "Tomate, ajo y orégano.", price: "9,50 €", priceNum: 9.5 },
  { name: "MARGHERITA", desc: "Tomate, mozzarella.", price: "10,00 €", priceNum: 10 },
  { name: "SICILIANA", desc: "Tomate, mozzarella, anchoas, alcaparras y olivas.", price: "11,00 €", priceNum: 11 },
  { name: "FUNGHI", desc: "Tomate, mozzarella y champiñones.", price: "11,00 €", priceNum: 11 },
  { name: "GRECA", desc: "Tomate, mozzarella y olivas negras.", price: "11,00 €", priceNum: 11 },
  { name: "TEDESCA", desc: "Tomate, mozzarella y frankfurt.", price: "11,00 €", priceNum: 11 },
  { name: "PICCANTE", desc: "Tomate, mozzarella y chorizo picante.", price: "11,00 €", priceNum: 11 },
  { name: "TARRAGONINA", desc: "Tomate, mozzarella, jamón y huevo.", price: "11,00 €", priceNum: 11 },
  { name: "PROSCIUTTO", desc: "Tomate, mozzarella y jamón dulce.", price: "11,00 €", priceNum: 11 },
  { name: "RÚSTICA", desc: "Tomate, mozzarella, bacon y cebolla.", price: "11,00 €", priceNum: 11 },
  { name: "CALABRESE", desc: "Tomate, mozzarella y embutido picante de Calabria.", price: "11,00 €", priceNum: 11 },
  { name: "TONNARA", desc: "Tomate, mozzarella y atún.", price: "11,00 €", priceNum: 11 },
  { name: "CATALANA", desc: "Base carbonara y bacon.", price: "11,00 €", priceNum: 11 },
  { name: "VEGETARIANA", desc: "Tomate, mozzarella, pimiento rojo, calabacín y berenjena.", price: "11,00 €", priceNum: 11 },
  { name: "4 STAGIONI", desc: "Tomate, mozzarella, champiñones, jamón dulce, alcachofas y embutido picante.", price: "12,00 €", priceNum: 12 },
  { name: "ITALIANA", desc: "Tomate, mozzarella búfala, tomate cherry y albahaca.", price: "14,00 €", priceNum: 14 },
  { name: "CIOCIARA", desc: "Mozzarella, longaniza Friarielli y tomate cherry.", price: "15,00 €", priceNum: 15 },
  { name: "FANTASÍA", desc: "Tomate, mozzarella, y 4 ingredientes a escoger.", price: "16,00 €", priceNum: 16 },
  { name: "MILANO", desc: "Tomate, mozzarella y salami milano.", price: "12,00 €", priceNum: 12 },
  { name: "BOSCAIOLA", desc: "Tomate, mozzarella, longaniza, champiñones y pimienta negra.", price: "13,50 €", priceNum: 13.5 },
  { name: "SPECK", desc: "Tomate, mozzarella, jamón ahumado y champiñones.", price: "14,00 €", priceNum: 14 },
  { name: "TROPEA", desc: "Mozzarella, cebolla roja, tomate natural y albahaca.", price: "13,00 €", priceNum: 13 },
  { name: "HAWAI", desc: "Tomate, mozzarella, piña, maíz y jamón.", price: "13,00 €", priceNum: 13 },
  { name: "BRESAOLINA", desc: "Tomate, mozzarella, embutido bresaola, rúcula y queso Grana Padano.", price: "14,00 €", priceNum: 14 },
  { name: "4 FORMAGGI", desc: "Tomate, mozzarella, gorgonzola, fontina, Emmental y queso de cabra.", price: "13,50 €", priceNum: 13.5 },
  { name: "FOCACCIA CRUDO", desc: "Aceite, romero, sal y jamón serrano.", price: "11,50 €", priceNum: 11.5 },
  { name: "FOCACCIA CAPRESE", desc: "Aceite, tomate fresco, mozzarella fresca y albahaca.", price: "11,50 €", priceNum: 11.5 },
  { name: "LA FOCACCIA DELLO ZIO", desc: "Bocconcini di mozzarella, salami picante, sobrasada picante, tomate fresco, aceite, orégano y guindilla.", price: "15,00 €", priceNum: 15 },
  { name: "SALENTINA", desc: "Mozzarella, burrata, tomate seco y rúcula.", price: "15,50 €", priceNum: 15.5 },
  { name: "LOMBARDA", desc: "Mozzarella, porchetta, scamorza, tomate cherry.", price: "16,00 €", priceNum: 16 },
  { name: "CALZONE", desc: "Tomate, mozzarella y jamón.", price: "11,00 €", priceNum: 11 },
  { name: "BIG CALZONE", desc: "Tomate, mozzarella, jamón, huevo y verdura.", price: "14,00 €", priceNum: 14 },
  { name: "RUSTICELLA (Calzone)", desc: "Tomate, mozzarella, jamón dulce, queso y verduras.", price: "15,00 €", priceNum: 15 },
  { name: "NORVEGIA", desc: "Mozzarella, burrata, salmón ahumado y rúcula.", price: "18,50 €", priceNum: 18.5 },
];

const extras: MenuItemData[] = [
  { name: "Verdura", price: "2,00 €", priceNum: 2 },
  { name: "Embutido / Queso", price: "3,00 €", priceNum: 3 },
  { name: "Mozzarella de búfala", price: "5,00 €", priceNum: 5 },
];

const bebidas: MenuItemData[] = [
  { name: "Caña pequeña", price: "2,50 €", priceNum: 2.5 },
  { name: "Caña grande", price: "3,00 €", priceNum: 3 },
  { name: "Mediana / Champú / Voll Damm / Sin alcohol", price: "3,00 €", priceNum: 3 },
  { name: "Refresco", price: "2,50 €", priceNum: 2.5 },
  { name: "Copa de vino", price: "4,00 €", priceNum: 4 },
  { name: "Botella vino blanco / Tinto italiano", price: "20,00 €", priceNum: 20 },
  { name: "Vichy catalán", price: "3,00 €", priceNum: 3 },
  { name: "Agua natural", price: "2,50 €", priceNum: 2.5 },
];

const postres: MenuItemData[] = [
  { name: "Tiramisú", price: "6,00 €", priceNum: 6 },
];

const MenuItem = ({ item, onAdd }: { item: MenuItemData; onAdd: () => void }) => (
  <div className="group flex justify-between items-start gap-3 py-2.5 border-b border-menu-teal/15 last:border-0 hover:bg-menu-teal/5 px-2 -mx-2 rounded transition-colors">
    <div className="flex-1 min-w-0">
      <span className="font-display font-bold text-menu-teal text-sm tracking-wide">{item.name}</span>
      {item.desc && <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{item.desc}</p>}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <span className="font-display font-bold text-foreground text-sm">{item.price}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 border-menu-teal/30 text-menu-teal hover:bg-menu-teal hover:text-menu-teal-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onAdd}
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
);

const MenuSection = () => {
  const { addItem } = useCart();
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
    toast.success(`${item.name} añadido al pedido`);
  };

  return (
    <section id="menu" className="py-24 px-4 bg-muted">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-menu-teal font-body uppercase tracking-[0.25em] text-sm mb-3">
            Nuestra Carta
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
            Pizzeria de Lo Zio
          </h2>
          <p className="font-display text-lg tracking-[0.3em] uppercase text-muted-foreground mb-6">
            Tarragona
          </p>
          <div className="inline-flex items-center gap-2 bg-menu-teal/10 text-menu-teal px-4 py-2 rounded-full text-sm font-body">
            <ShoppingCart className="w-4 h-4" />
            Toca cualquier plato para añadirlo a tu pedido
          </div>
        </div>

        {/* Pizzas */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <UtensilsCrossed className="w-6 h-6 text-menu-teal" />
            <h3 className="font-display text-3xl font-bold text-menu-teal">Pizzas</h3>
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

        {/* Extras */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Plus className="w-6 h-6 text-menu-teal" />
            <h3 className="font-display text-2xl font-bold text-menu-teal">Extras</h3>
          </div>
          <div className="max-w-sm">
            {extras.map((item) => (
              <MenuItem key={item.name} item={item} onAdd={() => handleAdd(item)} />
            ))}
          </div>
        </div>

        {/* Bebidas & Postres */}
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Wine className="w-6 h-6 text-menu-teal" />
              <h3 className="font-display text-2xl font-bold text-menu-teal">Bebidas</h3>
            </div>
            {bebidas.map((item) => (
              <MenuItem key={item.name} item={item} onAdd={() => handleAdd(item)} />
            ))}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <CakeSlice className="w-6 h-6 text-menu-teal" />
              <h3 className="font-display text-2xl font-bold text-menu-teal">Postre</h3>
            </div>
            {postres.map((item) => (
              <MenuItem key={item.name} item={item} onAdd={() => handleAdd(item)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
