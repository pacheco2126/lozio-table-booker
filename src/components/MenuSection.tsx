import { UtensilsCrossed, Wine, CakeSlice, Plus } from "lucide-react";

const pizzas = [
  { name: "MARINARA", desc: "Tomate, ajo y orégano.", price: "9,50 €" },
  { name: "MARGHERITA", desc: "Tomate, mozzarella.", price: "10,00 €" },
  { name: "SICILIANA", desc: "Tomate, mozzarella, anchoas, alcaparras y olivas.", price: "11,00 €" },
  { name: "FUNGHI", desc: "Tomate, mozzarella y champiñones.", price: "11,00 €" },
  { name: "GRECA", desc: "Tomate, mozzarella y olivas negras.", price: "11,00 €" },
  { name: "TEDESCA", desc: "Tomate, mozzarella y frankfurt.", price: "11,00 €" },
  { name: "PICCANTE", desc: "Tomate, mozzarella y chorizo picante.", price: "11,00 €" },
  { name: "TARRAGONINA", desc: "Tomate, mozzarella, jamón y huevo.", price: "11,00 €" },
  { name: "PROSCIUTTO", desc: "Tomate, mozzarella y jamón dulce.", price: "11,00 €" },
  { name: "RÚSTICA", desc: "Tomate, mozzarella, bacon y cebolla.", price: "11,00 €" },
  { name: "CALABRESE", desc: "Tomate, mozzarella y embutido picante de Calabria.", price: "11,00 €" },
  { name: "TONNARA", desc: "Tomate, mozzarella y atún.", price: "11,00 €" },
  { name: "CATALANA", desc: "Base carbonara y bacon.", price: "11,00 €" },
  { name: "VEGETARIANA", desc: "Tomate, mozzarella, pimiento rojo, calabacín y berenjena.", price: "11,00 €" },
  { name: "4 STAGIONI", desc: "Tomate, mozzarella, champiñones, jamón dulce, alcachofas y embutido picante.", price: "12,00 €" },
  { name: "ITALIANA", desc: "Tomate, mozzarella búfala, tomate cherry y albahaca.", price: "14,00 €" },
  { name: "CIOCIARA", desc: "Mozzarella, longaniza Friarielli y tomate cherry.", price: "15,00 €" },
  { name: "FANTASÍA", desc: "Tomate, mozzarella, y 4 ingredientes a escoger.", price: "16,00 €" },
  { name: "MILANO", desc: "Tomate, mozzarella y salami milano.", price: "12,00 €" },
  { name: "BOSCAIOLA", desc: "Tomate, mozzarella, longaniza, champiñones y pimienta negra.", price: "13,50 €" },
  { name: "SPECK", desc: "Tomate, mozzarella, jamón ahumado y champiñones.", price: "14,00 €" },
  { name: "TROPEA", desc: "Mozzarella, cebolla roja, tomate natural y albahaca.", price: "13,00 €" },
  { name: "HAWAI", desc: "Tomate, mozzarella, piña, maíz y jamón.", price: "13,00 €" },
  { name: "BRESAOLINA", desc: "Tomate, mozzarella, embutido bresaola, rúcula y queso Grana Padano.", price: "14,00 €" },
  { name: "4 FORMAGGI", desc: "Tomate, mozzarella, gorgonzola, fontina, Emmental y queso de cabra.", price: "13,50 €" },
  { name: "FOCACCIA CRUDO", desc: "Aceite, romero, sal y jamón serrano.", price: "11,50 €" },
  { name: "FOCACCIA CAPRESE", desc: "Aceite, tomate fresco, mozzarella fresca y albahaca.", price: "11,50 €" },
  { name: "LA FOCACCIA DELLO ZIO", desc: "Bocconcini di mozzarella, salami picante, sobrasada picante, tomate fresco, aceite, orégano y guindilla.", price: "15,00 €" },
  { name: "SALENTINA", desc: "Mozzarella, burrata, tomate seco y rúcula.", price: "15,50 €" },
  { name: "LOMBARDA", desc: "Mozzarella, porchetta, scamorza, tomate cherry.", price: "16,00 €" },
  { name: "CALZONE", desc: "Tomate, mozzarella y jamón.", price: "11,00 €" },
  { name: "BIG CALZONE", desc: "Tomate, mozzarella, jamón, huevo y verdura.", price: "14,00 €" },
  { name: "RUSTICELLA (Calzone)", desc: "Tomate, mozzarella, jamón dulce, queso y verduras.", price: "15,00 €" },
  { name: "NORVEGIA", desc: "Mozzarella, burrata, salmón ahumado y rúcula.", price: "18,50 €" },
];

const extras = [
  { name: "Verdura", price: "2,00 €" },
  { name: "Embutido / Queso", price: "3,00 €" },
  { name: "Mozzarella de búfala", price: "5,00 €" },
];

const bebidas = [
  { name: "Caña pequeña", price: "2,50 €" },
  { name: "Caña grande", price: "3,00 €" },
  { name: "Mediana / Champú / Voll Damm / Sin alcohol", price: "3,00 €" },
  { name: "Refresco", price: "2,50 €" },
  { name: "Copa de vino", price: "4,00 €" },
  { name: "Botella vino blanco / Tinto italiano", price: "20 €" },
  { name: "Vichy catalán", price: "3,00 €" },
  { name: "Agua natural", price: "2,50 €" },
];

const postres = [
  { name: "Tiramisú", price: "6,00 €" },
];

interface MenuItemProps {
  name: string;
  desc?: string;
  price: string;
}

const MenuItem = ({ name, desc, price }: MenuItemProps) => (
  <div className="flex justify-between items-start gap-4 py-2 border-b border-menu-teal/15 last:border-0">
    <div className="flex-1">
      <span className="font-display font-bold text-menu-teal text-sm tracking-wide">{name}</span>
      {desc && <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{desc}</p>}
    </div>
    <span className="font-display font-bold text-foreground text-sm whitespace-nowrap">{price}</span>
  </div>
);

const MenuSection = () => {
  const half = Math.ceil(pizzas.length / 2);
  const col1 = pizzas.slice(0, half);
  const col2 = pizzas.slice(half);

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
          <p className="font-display text-lg tracking-[0.3em] uppercase text-muted-foreground">
            Tarragona
          </p>
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
                <MenuItem key={item.name} {...item} />
              ))}
            </div>
            <div>
              {col2.map((item) => (
                <MenuItem key={item.name} {...item} />
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
              <MenuItem key={item.name} name={item.name} price={item.price} />
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
              <MenuItem key={item.name} name={item.name} price={item.price} />
            ))}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <CakeSlice className="w-6 h-6 text-menu-teal" />
              <h3 className="font-display text-2xl font-bold text-menu-teal">Postre</h3>
            </div>
            {postres.map((item) => (
              <MenuItem key={item.name} name={item.name} price={item.price} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
