import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { Bike, Store as StoreIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrderFlow, OrderType } from "@/contexts/OrderFlowContext";
import { isStoreOpen } from "@/lib/storeHours";
import { getNearestStore } from "@/lib/nearestStore";
import { toast } from "sonner";

interface StoreRow {
  slug: string;
  name: string;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
}

const OrderTypeDialog = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDialogOpen, closeDialog, setFlow } = useOrderFlow();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [tab, setTab] = useState<OrderType>("delivery");
  const [pickupStore, setPickupStore] = useState<string>("");
  const [address, setAddress] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!isDialogOpen) return;
    supabase
      .from("stores")
      .select("slug,name,accepts_delivery,accepts_pickup")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setStores((data as StoreRow[]) || []));
  }, [isDialogOpen]);

  const pickupStores = useMemo(() => stores.filter((s) => s.accepts_pickup), [stores]);
  const deliveryStores = useMemo(() => stores.filter((s) => s.accepts_delivery), [stores]);

  const handleConfirm = async () => {
    if (tab === "pickup") {
      if (!pickupStore) { toast.error(t("orderTypeDialog.errors.selectPickup")); return; }
      setFlow({
        orderType: "pickup",
        storeSlug: pickupStore,
        address: null,
        scheduledFor: null,
      });
      closeDialog();
      const el = document.getElementById("menu");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // delivery
    if (!address.trim() || !streetNumber.trim()) {
      toast.error(t("orderTypeDialog.errors.addressRequired"));
      return;
    }
    if (deliveryStores.length === 0) {
      toast.error(t("orderTypeDialog.errors.noDeliveryStores"));
      return;
    }
    setResolving(true);
    try {
      const fullAddress = `${address} ${streetNumber}`.trim();
      const nearest = await getNearestStore(fullAddress, city, postalCode);
      setFlow({
        orderType: "delivery",
        storeSlug: nearest,
        address: { address: fullAddress, streetNumber, city, postalCode },
        scheduledFor: null,
      });
      closeDialog();
      const el = document.getElementById("menu");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      toast.error(t("orderTypeDialog.errors.cannotAssign"));
    } finally {
      setResolving(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t("orderTypeDialog.title")}</DialogTitle>
          <DialogDescription>{t("orderTypeDialog.description")}</DialogDescription>
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
            <span className="font-body text-sm font-bold">{t("orderTypeDialog.delivery")}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("pickup")}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition-all ${
              tab === "pickup" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <StoreIcon className={`w-6 h-6 ${tab === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-body text-sm font-bold">{t("orderTypeDialog.pickup")}</span>
          </button>
        </div>

        {tab === "pickup" ? (
          <div className="space-y-2">
            <Label className="font-body text-sm">{t("orderTypeDialog.pickupStore")}</Label>
            {pickupStores.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("orderTypeDialog.noStores")}</p>
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
                    {open ? t("orderTypeDialog.open") : t("orderTypeDialog.closedSchedule")}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="font-body text-sm">{t("orderTypeDialog.address")}</Label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSelect={(r) => {
                  setAddress(r.address);
                  setCity(r.city);
                  setPostalCode(r.postalCode);
                }}
                placeholder={t("orderTypeDialog.addressPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <Label className="font-body text-sm">{t("orderTypeDialog.number")}</Label>
                <Input value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} placeholder="12" />
              </div>
              <div className="col-span-2">
                <Label className="font-body text-sm">{t("orderTypeDialog.postalCode")}</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="43001" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("orderTypeDialog.autoAssignHint")}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={closeDialog}>{t("orderTypeDialog.cancel")}</Button>
          <Button onClick={handleConfirm} disabled={resolving} className="font-body">
            {resolving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("orderTypeDialog.viewMenu")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTypeDialog;
