import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Wine,
  CakeSlice,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { extraCategories } from "@/lib/extras";

const SODAS = [
  { id: "coca-cola", name: "Coca-Cola", emoji: "🥤" },
  { id: "coca-cola-zero", name: "Coca-Cola Zero", emoji: "⬛" },
  { id: "fanta-naranja", name: "Fanta naranja", emoji: "🍊" },
  { id: "fanta-limon", name: "Fanta limón", emoji: "🍋" },
  { id: "fuze-tea", name: "Fuze Tea limón", emoji: "🫖" },
  { id: "aquarius", name: "Aquarius limón", emoji: "💛" },
];

const DRINKS = [
  { id: "cerveza", name: "Cerveza", emoji: "🍺", price: 3, expandable: false },
  { id: "refresco", name: "Refresco", emoji: "🥤", price: 2.5, expandable: true },
  { id: "vino", name: "Vino botella", emoji: "🍷", price: 20, expandable: false },
  { id: "agua", name: "Agua", emoji: "💧", price: 2.5, expandable: false },
];

const DESSERTS = [
  { id: "tiramisu", name: "Tiramisú", emoji: "🍮", price: 6, desc: "Casero · artesanal" },
];

const UPSELL_IDS = [
  ...DRINKS.map((d) => d.id),
  ...SODAS.map((s) => s.id),
  ...DESSERTS.map((d) => d.id),
];

// Extras picker with category tabs
const ExtrasPicker = ({
  itemId,
  onAdd,
}: {
  itemId: string;
  onAdd: (extra: { id: string; label: string; emoji: string; price: number }) => void;
}) => {
  const [activeCategory, setActiveCategory] = useState(extraCategories[0].id);
  const category = extraCategories.find((c) => c.id === activeCategory)!;

  return (
    <div className="mt-2 rounded-lg border border-border bg-background overflow-hidden">
      {/* Category tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-border">
        {extraCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-body font-bold whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              activeCategory === cat.id
                ? "border-menu-teal text-menu-teal bg-menu-teal/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.name}
          </button>
        ))}
      </div>
      {/* Items grid */}
      <div className="flex flex-wrap gap-1.5 p-2">
        {category.items.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              onAdd({ id: item.id, label: item.name, emoji: category.emoji, price: item.price })
            }
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border bg-background hover:border-menu-teal hover:bg-menu-teal/5 transition-all text-[10px] font-body font-semibold text-foreground"
          >
            {item.name}
            <span className="text-menu-teal">+{item.price} €</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const CartDrawer = () => {
  const {
    items,
    isOpen,
    setIsOpen,
    updateQuantity,
    updateNote,
    removeItem,
    addItem,
    addExtra,
    updateExtraQuantity,
    totalPrice,
    totalItems,
  } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [showExtras, setShowExtras] = useState<Record<string, boolean>>({});
  const [showSodas, setShowSodas] = useState(false);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate("/pedido");
  };

  const foodItems = items.filter((i) => !UPSELL_IDS.includes(i.id));

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <ShoppingBag className="w-5 h-5 text-menu-teal" />
            {t("cart.title")}
            {totalItems > 0 && (
              <span className="ml-auto text-sm font-body text-muted-foreground font-normal">
                {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground font-body px-5">
            <ShoppingBag className="w-12 h-12 text-border" />
            <p>{t("cart.empty")}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Food items */}
            <div className="px-5 py-4 space-y-3">
              {foodItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-muted/40 rounded-xl border border-border overflow-hidden"
                >
                  <div className="p-3">
                    {/* Pizza name + controls */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-foreground leading-tight">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/5 transition-colors ml-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-bold text-menu-teal">
                        {(item.price * item.quantity).toFixed(2)} €
                      </span>
                      <span className="text-[10px] text-muted-foreground font-body">
                        {item.price.toFixed(2)} € / ud
                      </span>
                    </div>

                    {/* Extras already added, nested inside this pizza */}
                    {(item.extras || []).length > 0 && (
                      <div className="mt-2 pl-2 border-l-2 border-menu-teal/30 space-y-1.5">
                        {(item.extras || []).map((extra) => (
                          <div key={extra.id} className="flex items-center justify-between">
                            <span className="text-[11px] font-body text-foreground flex items-center gap-1.5">
                              <span>{extra.emoji}</span>
                              {extra.label}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  updateExtraQuantity(item.id, extra.id, extra.quantity - 1)
                                }
                                className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">
                                {extra.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateExtraQuantity(item.id, extra.id, extra.quantity + 1)
                                }
                                className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-[11px] font-bold text-menu-teal ml-1 w-12 text-right">
                                +{(extra.price * extra.quantity).toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add extras toggle */}
                    <button
                      onClick={() =>
                        setShowExtras((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="flex items-center gap-1 text-[10px] font-body text-muted-foreground hover:text-menu-teal transition-colors mt-2"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Añadir ingrediente extra</span>
                      {showExtras[item.id] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {showExtras[item.id] && (
                      <ExtrasPicker
                        itemId={item.id}
                        onAdd={(extra) => addExtra(item.id, extra)}
                      />
                    )}

                    {/* Note */}
                    <button
                      onClick={() =>
                        setOpenNotes((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="flex items-center gap-1 text-[10px] font-body text-muted-foreground hover:text-menu-teal transition-colors mt-1.5"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{item.note ? "Editar nota" : "Añadir nota"}</span>
                      {openNotes[item.id] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    {item.note && !openNotes[item.id] && (
                      <p className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">
                        "{item.note}"
                      </p>
                    )}
                    {openNotes[item.id] && (
                      <textarea
                        autoFocus
                        value={item.note || ""}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        placeholder="Ej: sin cebolla, muy hecho, poco tomate..."
                        rows={2}
                        maxLength={120}
                        className="mt-1.5 w-full text-xs font-body rounded-lg border border-border bg-background px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-menu-teal placeholder:text-muted-foreground/50"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-border" />

            {/* Drinks */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Wine className="w-4 h-4 text-menu-teal" />
                <span className="font-display font-bold text-sm text-foreground">Bebidas</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DRINKS.map((d) => {
                  const inCart = items.find((i) => i.id === d.id);
                  if (d.expandable) {
                    // Refresco — show soda picker on click
                    const sodasInCart = SODAS.filter((s) => items.find((i) => i.id === s.id));
                    const totalSodas = sodasInCart.reduce((sum, s) => {
                      const cartItem = items.find((i) => i.id === s.id);
                      return sum + (cartItem?.quantity ?? 0);
                    }, 0);
                    return (
                      <div key={d.id} className="col-span-2">
                        <button
                          onClick={() => setShowSodas((v) => !v)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${
                            showSodas || totalSodas > 0
                              ? "border-menu-teal bg-menu-teal/5"
                              : "border-border bg-background hover:border-menu-teal hover:bg-menu-teal/5"
                          }`}
                        >
                          <span className="text-xl">{d.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-xs text-foreground">
                              {d.name}
                            </p>
                            <p className="text-[10px] text-menu-teal font-body font-semibold">
                              {d.price.toFixed(2)} €
                            </p>
                          </div>
                          {totalSodas > 0 && (
                            <span className="text-[10px] font-bold bg-menu-teal text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                              {totalSodas}
                            </span>
                          )}
                          {showSodas ? (
                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                        </button>

                        {/* Soda picker */}
                        {showSodas && (
                          <div className="mt-2 rounded-xl border border-menu-teal/20 bg-background overflow-hidden">
                            <p className="px-3 pt-2.5 pb-1 text-[10px] font-body font-bold text-muted-foreground uppercase tracking-wider">
                              ¿Cuál prefieres?
                            </p>
                            <div className="px-2 pb-2 space-y-1">
                              {SODAS.map((soda) => {
                                const sodaInCart = items.find((i) => i.id === soda.id);
                                return (
                                  <div
                                    key={soda.id}
                                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                                  >
                                    <span className="flex items-center gap-2 text-sm font-body text-foreground">
                                      <span className="text-base">{soda.emoji}</span>
                                      {soda.name}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {sodaInCart ? (
                                        <>
                                          <button
                                            onClick={() =>
                                              updateQuantity(soda.id, sodaInCart.quantity - 1)
                                            }
                                            className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="w-5 text-center text-sm font-bold">
                                            {sodaInCart.quantity}
                                          </span>
                                          <button
                                            onClick={() =>
                                              updateQuantity(soda.id, sodaInCart.quantity + 1)
                                            }
                                            className="w-6 h-6 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            addItem({ id: soda.id, name: soda.name, price: d.price })
                                          }
                                          className="w-6 h-6 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Regular drink
                  return (
                    <div
                      key={d.id}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                        inCart
                          ? "border-menu-teal bg-menu-teal/5"
                          : "border-border bg-background hover:border-menu-teal hover:bg-menu-teal/5"
                      }`}
                    >
                      <span className="text-xl">{d.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-xs text-foreground truncate">
                          {d.name}
                        </p>
                        <p className="text-[10px] text-menu-teal font-body font-semibold">
                          {d.price.toFixed(2)} €
                        </p>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => updateQuantity(d.id, inCart.quantity - 1)}
                            className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-4 text-center text-xs font-bold">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(d.id, inCart.quantity + 1)}
                            className="w-5 h-5 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem({ id: d.id, name: d.name, price: d.price })}
                          className="w-6 h-6 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desserts */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <CakeSlice className="w-4 h-4 text-menu-teal" />
                <span className="font-display font-bold text-sm text-foreground">Postres</span>
              </div>
              {DESSERTS.map((d) => {
                const inCart = items.find((i) => i.id === d.id);
                return (
                  <div
                    key={d.id}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      inCart
                        ? "border-menu-teal bg-menu-teal/5"
                        : "border-border bg-background hover:border-menu-teal hover:bg-menu-teal/5"
                    }`}
                  >
                    <span className="text-2xl">{d.emoji}</span>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-display font-bold text-sm text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground font-body">{d.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-display font-bold text-menu-teal text-sm">
                        {d.price.toFixed(2)} €
                      </span>
                      {inCart ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(d.id, inCart.quantity - 1)}
                            className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-4 text-center text-xs font-bold">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(d.id, inCart.quantity + 1)}
                            className="w-5 h-5 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem({ id: d.id, name: d.name, price: d.price })}
                          className="w-6 h-6 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <SheetFooter className="border-t border-border px-5 py-4 mt-auto">
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-display text-base font-bold text-foreground">
                  {t("cart.total")}
                </span>
                <span className="font-display text-2xl font-bold text-menu-teal">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full bg-menu-teal hover:bg-menu-teal/90 text-menu-teal-foreground font-display text-base py-6 rounded-xl"
              >
                {t("cart.checkout")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
