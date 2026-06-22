import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { Bike, Store as StoreIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrderFlow, OrderType } from "@/contexts/OrderFlowContext";
import { useCart } from "@/contexts/CartContext";
import { isStoreOpen } from "@/lib/storeHours";
import { getNearestStore } from "@/lib/nearestStore";
import { toast } from "sonner";
import { UPSELL_IDS } from "@/lib/upsell";

interface StoreRow {
  slug: string;
  name: string;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const normalize = (v: string) =>
  v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/**
 * Validates that the cart items are available at the chosen store.
 * Unavailable items are removed and reported via toast.
 */
async function verifyCartAvailability(
  storeSlug: string,
  cartItems: { id: string; name: string }[],
  removeItem: (id: string) => void,
): Promise<void> {
  const foodItems = cartItems.filter((i) => !UPSELL_IDS.includes(i.id));
  if (foodItems.length === 0) return;

  const { data: menuRows } = await supabase
    .from("menu_items")
    .select("id,name,is_active")
    .in("category", ["pizzas", "focaccias", "calzones"]);

  const byName = new Map<string, { id: string; is_active: boolean }>();
  (menuRows || []).forEach((r) =>
    byName.set(normalize(r.name), { id: r.id, is_active: r.is_active }),
  );

  const itemIds = Array.from(
    new Set(
      foodItems
        .map((c) => byName.get(normalize(c.name))?.id)
        .filter((x): x is string => !!x),
    ),
  );

  let availMap = new Map<string, { isAvailable: boolean }>();
  if (itemIds.length) {
    const { data: availRows } = await supabase
      .from("menu_item_store_availability")
      .select("menu_item_id,is_available,unavailable_until")
      .eq("store_slug", storeSlug)
      .in("menu_item_id", itemIds);

    const now = Date.now();
    (availRows || []).forEach((r) => {
      const expired = r.unavailable_until && new Date(r.unavailable_until).getTime() <= now;
      availMap.set(r.menu_item_id, { isAvailable: r.is_available || !!expired });
    });
  }

  const unavailable: string[] = [];
  for (const ci of foodItems) {
    const m = byName.get(normalize(ci.name));
    if (!m || !m.is_active) {
      unavailable.push(ci.name);
      removeItem(ci.id);
      continue;
    }
    const a = availMap.get(m.id);
    if (a && !a.isAvailable) {
      unavailable.push(ci.name);
      removeItem(ci.id);
    }
  }

  if (unavailable.length > 0) {
    toast.warning(
      `Estos productos no están disponibles en este local y se han retirado del carrito: ${unavailable.join(", ")}`,
      { duration: 6000 },
    );
  }
}

const CartLocationDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { setFlow, orderType, storeSlug, address: existingAddress } = useOrderFlow();
  const { items, removeItem } = useCart();

  const [stores, setStores] = useState<StoreRow[]>([]);
  const [tab, setTab] = useState<OrderType>(orderType ?? "delivery");
  const [pickupStore, setPickupStore] = useState<string>(
    orderType === "pickup" && storeSlug ? storeSlug : "",
  );
  const [address, setAddress] = useState(existingAddress?.address ?? "");
  const [streetNumber, setStreetNumber] = useState(existingAddress?.streetNumber ?? "");
  const [city, setCity] = useState(existingAddress?.city ?? "");
  const [postalCode, setPostalCode] = useState(existingAddress?.postalCode ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Fetch stores once on mount so the dialog is ready immediately the first time it opens
  useEffect(() => {
    supabase
      .from("stores")
      .select("slug,name,accepts_delivery,accepts_pickup")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setStores((data as StoreRow[]) || []));
  }, []);

  // Sync local form state with the latest orderFlow whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setTab(orderType ?? "delivery");
    setPickupStore(orderType === "pickup" && storeSlug ? storeSlug : "");
    setAddress(existingAddress?.address ?? "");
    setStreetNumber(existingAddress?.streetNumber ?? "");
    setCity(existingAddress?.city ?? "");
    setPostalCode(existingAddress?.postalCode ?? "");
  }, [open, orderType, storeSlug, existingAddress]);

  const pickupStores = useMemo(() => stores.filter((s) => s.accepts_pickup), [stores]);
  const deliveryStores = useMemo(() => stores.filter((s) => s.accepts_delivery), [stores]);

  const handleAccept = async () => {
    if (tab === "pickup") {
      if (!pickupStore) {
        toast.error(t("orderTypeDialog.errors.selectPickup", "Selecciona un local"));
        return;
      }
      setSubmitting(true);
      try {
        setFlow({
          orderType: "pickup",
          storeSlug: pickupStore,
          address: null,
          scheduledFor: null,
        });
        await verifyCartAvailability(pickupStore, items, removeItem);
        onOpenChange(false);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // delivery
    if (!address.trim() || !streetNumber.trim()) {
      toast.error(t("orderTypeDialog.errors.addressRequired", "Introduce dirección y número"));
      return;
    }
    if (deliveryStores.length === 0) {
      toast.error(t("orderTypeDialog.errors.noDeliveryStores", "No hay locales con delivery"));
      return;
    }
    setSubmitting(true);
    try {
      const fullAddress = `${address} ${streetNumber}`.trim();
      const nearest = await getNearestStore(fullAddress, city, postalCode);
      setFlow({
        orderType: "delivery",
        storeSlug: nearest,
        address: { address: fullAddress, streetNumber, city, postalCode },
        scheduledFor: null,
      });
      await verifyCartAvailability(nearest, items, removeItem);
      onOpenChange(false);
    } catch {
      toast.error(t("orderTypeDialog.errors.cannotAssign", "No se pudo asignar local"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display">
            Confirma tu pedido
          </DialogTitle>
          <DialogDescription>
            Necesitamos saber cómo y dónde recibir tu pedido para verificar disponibilidad.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 my-2">
          <button
            type="button"
            onClick={() => setTab("delivery")}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition-all ${
              tab === "delivery" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Bike className={`w-6 h-6 ${tab === "delivery" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-body text-sm font-bold">{t("orderTypeDialog.delivery", "A domicilio")}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("pickup")}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition-all ${
              tab === "pickup" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <StoreIcon className={`w-6 h-6 ${tab === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-body text-sm font-bold">{t("orderTypeDialog.pickup", "Recoger")}</span>
          </button>
        </div>

        {tab === "pickup" ? (
          <div className="space-y-2">
            <Label className="font-body text-sm">{t("orderTypeDialog.pickupStore", "Local para recoger")}</Label>
            {pickupStores.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("orderTypeDialog.noStores", "Sin locales disponibles")}</p>
            )}
            {pickupStores.map((s) => {
              const open = isStoreOpen(s.slug);
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setPickupStore(s.slug)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    pickupStore === s.slug ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="font-body font-bold text-sm">{s.name}</span>
                  <span className={`text-xs font-body px-2 py-0.5 rounded-full ${
                    open ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                         : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}>
                    {open ? t("orderTypeDialog.open", "Abierto") : t("orderTypeDialog.closedSchedule", "Cerrado")}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="font-body text-sm">{t("orderTypeDialog.address", "Dirección")}</Label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSelect={(r) => {
                  setAddress(r.address);
                  setCity(r.city);
                  setPostalCode(r.postalCode);
                }}
                placeholder={t("orderTypeDialog.addressPlaceholder", "Calle...")}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <Label className="font-body text-sm">{t("orderTypeDialog.number", "Nº")}</Label>
                <Input value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} placeholder="12" />
              </div>
              <div className="col-span-2">
                <Label className="font-body text-sm">{t("orderTypeDialog.postalCode", "Código postal")}</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="43001" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("orderTypeDialog.autoAssignHint", "Te asignaremos el local más cercano")}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleAccept} disabled={submitting} className="font-body">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CartLocationDialog;
