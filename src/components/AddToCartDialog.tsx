import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus, MessageSquare, ShoppingBag, Wine, CakeSlice, X } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";
import { extraCategories } from "@/lib/extras";
import type { CartItemExtra } from "@/contexts/CartContext";
import pizzaPlaceholder from "@/assets/pizza-placeholder.jpg";

interface MenuItem {
  name: string;
  desc?: string;
  price: string;
  priceNum: number;
}

interface AddToCartDialogProps {
  item: MenuItem | null;
  imageUrl?: string | null;
  open: boolean;
  freeExtras?: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: (extras: CartItemExtra[], note: string) => void;
}

// ─── Upsell data ────────────────────────────────────────────────────────────

const SODAS = [
  { id: "soda_coca-cola",       name: "Coca-Cola",       emoji: "🥤" },
  { id: "soda_coca-cola-zero",  name: "Coca-Cola Zero",  emoji: "⬛" },
  { id: "soda_fanta-naranja",   name: "Fanta naranja",   emoji: "🍊" },
  { id: "soda_fanta-limon",     name: "Fanta limón",     emoji: "🍋" },
  { id: "soda_fuze-tea",        name: "Fuze Tea limón",  emoji: "🫖" },
  { id: "soda_aquarius",        name: "Aquarius limón",  emoji: "💛" },
];

const DRINKS_SIMPLE = [
  { id: "drink_agua",     name: "Agua",          emoji: "💧", price: 2.5 },
  { id: "drink_cerveza",  name: "Cerveza",       emoji: "🍺", price: 3   },
  { id: "drink_vino",     name: "Vino botella",  emoji: "🍷", price: 20  },
  
];
const SODA_PRICE = 2.5;

const TIRAMISU = { id: "dessert_tiramisu", name: "Tiramisú", emoji: "🍮", price: 6 };

// ─── Sub-components ──────────────────────────────────────────────────────────

const ExtrasPicker = ({
  extras,
  onAdd,
  onRemove,
  freeExtras,
}: {
  extras: CartItemExtra[];
  onAdd: (extra: Omit<CartItemExtra, "quantity">) => void;
  onRemove: (id: string) => void;
  freeExtras?: number;
}) => {
  const [activeCategory, setActiveCategory] = useState(extraCategories[0].id);
  const category = extraCategories.find((c) => c.id === activeCategory)!;
  const selectedCount = extras.reduce((sum, e) => sum + e.quantity, 0); // total units selected

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      {/* Free slot counter */}
      {freeExtras && (
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          <div className="flex gap-1">
            {Array.from({ length: freeExtras }).map((_, i) => (
              <span
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-colors ${
                  i < selectedCount
                    ? "bg-menu-teal border-menu-teal"
                    : "border-muted-foreground/30 bg-transparent"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-body text-muted-foreground">
            {selectedCount < freeExtras
              ? `${freeExtras - selectedCount} gratis restante${freeExtras - selectedCount !== 1 ? "s" : ""}`
              : selectedCount === freeExtras
              ? "✓ 4 ingredientes seleccionados"
              : `+${selectedCount - freeExtras} con coste adicional`}
          </span>
        </div>
      )}
      <div className="flex overflow-x-auto no-scrollbar border-b border-border bg-background">
        {extraCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 px-3 py-2 text-[11px] font-body font-bold whitespace-nowrap shrink-0 transition-colors border-b-2 ${
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
      <div className="flex flex-wrap gap-1.5 p-3">
        {category.items.map((item) => {
          const existing = extras.find((e) => e.id === item.id);
          // Cumulative qty of items before this one in the list
          const qtyBefore = existing
            ? extras.slice(0, extras.findIndex((e) => e.id === item.id)).reduce((s, e) => s + e.quantity, 0)
            : 0;
          const isFree = freeExtras
            ? existing
              ? qtyBefore < freeExtras // at least first unit of this item falls in free zone
              : selectedCount < freeExtras // adding it would use a free slot
            : false;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (existing) {
                  onRemove(item.id);
                } else {
                  onAdd({ id: item.id, label: item.name, emoji: category.emoji, price: item.price });
                }
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-all text-[11px] font-body font-semibold ${
                existing
                  ? "border-menu-teal bg-menu-teal/10 text-menu-teal"
                  : "border-border bg-background hover:border-menu-teal hover:bg-menu-teal/5 text-foreground"
              }`}
            >
              {existing && <span className="font-bold">{existing.quantity}×</span>}
              {item.name}
              <span className={existing ? "text-menu-teal/70" : isFree ? "text-green-600 font-bold" : "text-menu-teal"}>
                {isFree
                  ? existing ? "Gratis" : "Gratis"
                  : existing
                  ? `+${(item.price * existing.quantity).toFixed(2)} €`
                  : `+${item.price} €`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Generic +/- stepper row used for drinks & tiramisu */
const UpsellRow = ({
  id,
  emoji,
  name,
  price,
  quantity,
  onAdd,
  onChangeQty,
}: {
  id: string;
  emoji: string;
  name: string;
  price: number;
  quantity: number;
  onAdd: () => void;
  onChangeQty: (qty: number) => void;
}) => (
  <div className="flex items-center justify-between px-1 py-1.5">
    <span className="flex items-center gap-2 text-sm font-body text-foreground">
      <span className="text-lg">{emoji}</span>
      <span>
        {name}
        <span className="ml-1.5 text-[11px] text-menu-teal font-semibold">
          {price.toFixed(2)} €
        </span>
      </span>
    </span>
    {quantity > 0 ? (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChangeQty(quantity - 1)}
          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-sm font-bold">{quantity}</span>
        <button
          onClick={() => onChangeQty(quantity + 1)}
          className="w-6 h-6 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    ) : (
      <button
        onClick={onAdd}
        className="w-6 h-6 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    )}
  </div>
);

// ─── Main dialog ─────────────────────────────────────────────────────────────

const AddToCartDialog = ({
  item,
  imageUrl,
  open,
  freeExtras,
  onOpenChange,
  onConfirm,
}: AddToCartDialogProps) => {
  const { t } = useTranslation();

  const [extras, setExtras] = useState<CartItemExtra[]>([]);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showSodas, setShowSodas] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setShowButton(false); return; }
    // Wait a tick for the dialog DOM to mount
    const timer = setTimeout(() => {
      const el = noteRef.current;
      const root = scrollRef.current;
      if (!el || !root) return;
      const observer = new IntersectionObserver(
        ([entry]) => setShowButton(entry.isIntersecting),
        { root, threshold: 0.1 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setExtras([]);
      setNote("");
      setShowNote(false);
      setShowSodas(false);
      setShowButton(false);
    }
    onOpenChange(val);
  };

  // ── extras helpers ──
  const handleAddExtra = (extra: Omit<CartItemExtra, "quantity">) => {
    setExtras((prev) => {
      const existing = prev.find((e) => e.id === extra.id);
      if (existing) return prev.map((e) => e.id === extra.id ? { ...e, quantity: e.quantity + 1 } : e);
      return [...prev, { ...extra, quantity: 1 }];
    });
  };

  const handleRemoveExtra = (id: string) => {
    setExtras((prev) => {
      const existing = prev.find((e) => e.id === id);
      if (!existing) return prev;
      if (existing.quantity > 1) return prev.map((e) => e.id === id ? { ...e, quantity: e.quantity - 1 } : e);
      return prev.filter((e) => e.id !== id);
    });
  };

  const handleUpdateQty = (id: string, qty: number) => {
    if (qty <= 0) setExtras((prev) => prev.filter((e) => e.id !== id));
    else setExtras((prev) => prev.map((e) => e.id === id ? { ...e, quantity: qty } : e));
  };

  // ── upsell helpers (reuse extras state with prefixed ids) ──
  const getQty = (id: string) => extras.find((e) => e.id === id)?.quantity ?? 0;

  const addUpsell = (id: string, label: string, emoji: string, price: number) => {
    handleAddExtra({ id, label, emoji, price });
  };

  // ── ingredient extras (no drinks/sodas/desserts) ──
  const ingredientExtras = extras.filter(
    (e) => !e.id.startsWith("drink_") && !e.id.startsWith("soda_") && !e.id.startsWith("dessert_")
  );

  // How much of an ingredient extra is free, given cumulative slots before it.
  // Returns the effective unit price (0 if all free, original if all paid, or original
  // for the paid portion — we track this per-unit in the total/confirm).
  const ingredientSlotsUsed = (upToIndex: number): number =>
    ingredientExtras.slice(0, upToIndex).reduce((sum, e) => sum + e.quantity, 0);

  const effectiveIngredientPrice = (extra: CartItemExtra, index: number): number => {
    if (!freeExtras) return extra.price;
    const slotsBefore = ingredientSlotsUsed(index);
    if (slotsBefore >= freeExtras) return extra.price;        // fully paid
    if (slotsBefore + extra.quantity <= freeExtras) return 0; // fully free
    return extra.price; // partially free — shown as paid in display (see total below)
  };

  // Per-unit total that respects the free quota correctly
  const ingredientExtrasTotal = (): number => {
    let slotsUsed = 0;
    let total = 0;
    for (const extra of ingredientExtras) {
      for (let u = 0; u < extra.quantity; u++) {
        if (!freeExtras || slotsUsed >= freeExtras) total += extra.price;
        slotsUsed++;
      }
    }
    return total;
  };

  // Recalculate all extras with correct prices before submitting
  const extrasWithEffectivePrices = (): CartItemExtra[] => {
    let slotsUsed = 0;
    return extras.map((extra) => {
      const isIngredient = !extra.id.startsWith("drink_") && !extra.id.startsWith("soda_") && !extra.id.startsWith("dessert_");
      if (!isIngredient || !freeExtras) return extra;
      // Calculate per-item effective unit price based on slots used so far
      const freeUnits = Math.max(0, freeExtras - slotsUsed);
      const paidUnits = Math.max(0, extra.quantity - freeUnits);
      slotsUsed += extra.quantity;
      // Represent as a blended unit price (free units = 0, paid = original)
      const effectiveUnitPrice = paidUnits > 0 && extra.quantity > 0
        ? (paidUnits * extra.price) / extra.quantity
        : 0;
      return { ...extra, price: effectiveUnitPrice };
    });
  };

  const extrasTotal =
    ingredientExtrasTotal() +
    extras
      .filter((e) => e.id.startsWith("drink_") || e.id.startsWith("soda_") || e.id.startsWith("dessert_"))
      .reduce((sum, e) => sum + e.price * e.quantity, 0);

  const totalPrice = item ? item.priceNum + extrasTotal : 0;

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col [&>button:first-of-type]:hidden">

        {/* ── Image header ── */}
        <div className="relative shrink-0" style={{ paddingBottom: "45%" }}>
          <img
            src={imageUrl || pizzaPlaceholder}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Custom close button over the image */}
          <DialogClose className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
            <X className="w-4 h-4" />
          </DialogClose>
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-white text-xl leading-tight drop-shadow">
                {item.name}
              </DialogTitle>
              {item.desc && (
                <p className="text-white/80 text-xs font-body leading-snug line-clamp-2 mt-0.5">
                  {item.desc}
                </p>
              )}
            </DialogHeader>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-5">

          {/* 1. Extras picker */}
          <div>
            <p className="font-display font-bold text-sm text-foreground mb-2">
              {freeExtras ? t("dialog.addExtrasCustom") : t("dialog.addExtras")}
            </p>
            <ExtrasPicker
              extras={ingredientExtras}
              onAdd={handleAddExtra}
              onRemove={handleRemoveExtra}
              freeExtras={freeExtras}
            />
          </div>

          {/* Selected ingredient-extras summary */}
          {ingredientExtras.length > 0 && (
            <div className="pl-2 border-l-2 border-menu-teal/40 space-y-1.5">
              {(() => {
                let slotsUsed = 0;
                return ingredientExtras.map((extra) => {
                  const freeUnits = freeExtras ? Math.max(0, freeExtras - slotsUsed) : 0;
                  const paidUnits = Math.max(0, extra.quantity - freeUnits);
                  slotsUsed += extra.quantity;
                  const label =
                    !freeExtras || paidUnits === 0
                      ? freeExtras ? "Gratis" : `+${(extra.price * extra.quantity).toFixed(2)} €`
                      : freeUnits === 0
                      ? `+${(extra.price * extra.quantity).toFixed(2)} €`
                      : `${freeUnits} gratis · +${(extra.price * paidUnits).toFixed(2)} €`;
                  const isAllFree = freeExtras !== undefined && paidUnits === 0;
                  return (
                    <div key={extra.id} className="flex items-center justify-between">
                      <span className="text-xs font-body text-foreground flex items-center gap-1.5">
                        <span>{extra.emoji}</span>
                        {extra.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateQty(extra.id, extra.quantity - 1)}
                          className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{extra.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(extra.id, extra.quantity + 1)}
                          className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        <span className={`text-xs font-bold ml-1 w-28 text-right ${isAllFree ? "text-green-600" : "text-menu-teal"}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          <div className="border-t border-border" />

          {/* 2. ¿Algo de beber? */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wine className="w-4 h-4 text-menu-teal" />
              <p className="font-display font-bold text-sm text-foreground">
                {t("dialog.drinksSection")}
              </p>
            </div>
            <div className="space-y-0.5">
              
              {/* Refresco expandable */}
              <div>
                <button
                  onClick={() => setShowSodas((v) => !v)}
                  className="flex items-center w-full px-1 py-1.5 text-sm font-body text-foreground hover:text-menu-teal transition-colors"
                >
                  <span className="text-lg mr-2">🥤</span>
                  <span className="flex-1 text-left">
                    Refresco
                    <span className="ml-1.5 text-[11px] text-menu-teal font-semibold">
                      {SODA_PRICE.toFixed(2)} €
                    </span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                {showSodas && (
                  <div className="ml-8 mt-1 rounded-xl border border-menu-teal/20 bg-background overflow-hidden">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-body font-bold text-muted-foreground uppercase tracking-wider">
                      ¿Cuál prefieres?
                    </p>
                    <div className="px-2 pb-2 space-y-0.5">
                      {SODAS.map((soda) => (
                        <UpsellRow
                          key={soda.id}
                          id={soda.id}
                          emoji={soda.emoji}
                          name={soda.name}
                          price={SODA_PRICE}
                          quantity={getQty(soda.id)}
                          onAdd={() => addUpsell(soda.id, soda.name, soda.emoji, SODA_PRICE)}
                          onChangeQty={(qty) => handleUpdateQty(soda.id, qty)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Simple drinks */}
              {DRINKS_SIMPLE.map((d) => (
                <UpsellRow
                  key={d.id}
                  id={d.id}
                  emoji={d.emoji}
                  name={d.name}
                  price={d.price}
                  quantity={getQty(d.id)}
                  onAdd={() => addUpsell(d.id, d.name, d.emoji, d.price)}
                  onChangeQty={(qty) => handleUpdateQty(d.id, qty)}
                />
              ))}

            </div>
          </div>

          <div className="border-t border-border" />

          {/* 3. El toque dulce */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CakeSlice className="w-4 h-4 text-menu-teal" />
              <p className="font-display font-bold text-sm text-foreground">
                {t("dialog.dessertSection")}
              </p>
            </div>
            <div
              className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all cursor-pointer ${
                getQty(TIRAMISU.id) > 0
                  ? "border-menu-teal bg-menu-teal/5"
                  : "border-border bg-muted/30 hover:border-menu-teal hover:bg-menu-teal/5"
              }`}
            >
              <span className="text-2xl">{TIRAMISU.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-foreground">{TIRAMISU.name}</p>
                <p className="text-xs text-muted-foreground font-body">
                  {t("dialog.tiramisuDesc")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-display font-bold text-menu-teal text-sm">
                  {TIRAMISU.price.toFixed(2)} €
                </span>
                {getQty(TIRAMISU.id) > 0 ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateQty(TIRAMISU.id, getQty(TIRAMISU.id) - 1)}
                      className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{getQty(TIRAMISU.id)}</span>
                    <button
                      onClick={() => handleUpdateQty(TIRAMISU.id, getQty(TIRAMISU.id) + 1)}
                      className="w-6 h-6 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addUpsell(TIRAMISU.id, TIRAMISU.name, TIRAMISU.emoji, TIRAMISU.price)}
                    className="w-6 h-6 rounded-full bg-menu-teal text-white flex items-center justify-center hover:bg-menu-teal/90 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* 4. Note */}
          <div ref={noteRef}>
            <button
              onClick={() => setShowNote((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-menu-teal transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{note ? t("dialog.editNote") : t("dialog.addNote")}</span>
            </button>
            {note && !showNote && (
              <p className="text-[11px] text-muted-foreground italic mt-1 line-clamp-1">"{note}"</p>
            )}
            {showNote && (
              <textarea
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("dialog.notePlaceholder")}
                rows={2}
                maxLength={120}
                className="mt-2 w-full text-xs font-body rounded-lg border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-menu-teal placeholder:text-muted-foreground/50"
              />
            )}
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className={`shrink-0 border-t border-border px-4 py-3 bg-background transition-all duration-300 ${showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <Button
            onClick={() => onConfirm(extrasWithEffectivePrices(), note)}
            className="w-full bg-menu-teal hover:bg-menu-teal/90 text-menu-teal-foreground font-display font-bold text-sm py-5 rounded-xl"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {t("dialog.addToCart")}
            <span className="ml-auto font-body font-bold">
              {totalPrice.toFixed(2)} €
            </span>
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default AddToCartDialog;
