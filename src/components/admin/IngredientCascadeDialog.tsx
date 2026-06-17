import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package2 } from "lucide-react";

interface StoreRow { slug: string; name: string; accepts_delivery: boolean; accepts_pickup: boolean; }
interface RelatedItem { id: string; name: string; category: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItemId: string | null;
  inventoryItemName?: string;
  defaultStoreSlug?: string | null;
  onConfirmed?: () => void;
}

const PAGE_SIZE = 6;

const IngredientCascadeDialog = ({ open, onOpenChange, inventoryItemId, inventoryItemName, defaultStoreSlug, onConfirmed }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [items, setItems] = useState<RelatedItem[]>([]);
  // per-item per-store selection of which to disable
  const [selection, setSelection] = useState<Record<string, Record<string, boolean>>>({});
  const [page, setPage] = useState(0);


  useEffect(() => {
    if (!open || !inventoryItemId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [storesRes, linkRes] = await Promise.all([
        supabase.from("stores").select("slug,name,accepts_delivery,accepts_pickup").eq("is_active", true).order("sort_order"),
        supabase.from("menu_item_ingredients")
          .select("menu_item_id, menu_items!inner(id,name,category,is_active)")
          .eq("inventory_item_id", inventoryItemId),
      ]);
      if (cancelled) return;
      const sList = ((storesRes.data as StoreRow[]) || []).filter(s => s.accepts_delivery || s.accepts_pickup);
      setStores(sList);
      const related: RelatedItem[] = ((linkRes.data as Array<{ menu_items: RelatedItem & { is_active: boolean } }>) || [])
        .map(r => r.menu_items)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      setItems(related);
      // default selection: if a store slug is provided, preselect it for every item
      const initial: Record<string, Record<string, boolean>> = {};
      related.forEach(it => {
        const perStore: Record<string, boolean> = {};
        sList.forEach(s => { perStore[s.slug] = defaultStoreSlug ? s.slug === defaultStoreSlug : true; });
        initial[it.id] = perStore;
      });
      setSelection(initial);
      setPage(0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, inventoryItemId, defaultStoreSlug]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, Record<string, boolean>> = {};
    items.forEach(it => {
      const perStore: Record<string, boolean> = {};
      stores.forEach(s => { perStore[s.slug] = checked; });
      next[it.id] = perStore;
    });
    setSelection(next);
  };

  const allSelected = items.length > 0 && items.every(it =>
    stores.every(s => selection[it.id]?.[s.slug])
  );

  const handleConfirm = async () => {
    const rows: Array<{ menu_item_id: string; store_slug: string; is_available: boolean; unavailable_until: null }> = [];
    items.forEach(it => {
      stores.forEach(s => {
        if (selection[it.id]?.[s.slug]) {
          rows.push({ menu_item_id: it.id, store_slug: s.slug, is_available: false, unavailable_until: null });
        }
      });
    });
    if (rows.length === 0) {
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("menu_item_store_availability")
      .upsert(rows, { onConflict: "menu_item_id,store_slug" });
    setSubmitting(false);
    if (error) { toast.error(t("ingredientCascade.errorCascade", { message: error.message })); return; }
    toast.success(t("ingredientCascade.successCount", { count: rows.length }));
    onConfirmed?.();
    onOpenChange(false);
  };

  const handleSkip = () => {
    onConfirmed?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Package2 className="w-5 h-5 text-primary" />
            {t("ingredientCascade.title")}
          </DialogTitle>
          <DialogDescription>
            {inventoryItemName ? <>{t("ingredientCascade.descriptionUsage", { name: inventoryItemName })} </> : null}
            {t("ingredientCascade.descriptionAction")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground text-center py-8">
            {t("ingredientCascade.empty")}
          </p>
        ) : (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 px-2">
              <Checkbox id="select-all" checked={allSelected} onCheckedChange={(v) => toggleAll(!!v)} />
              <label htmlFor="select-all" className="font-body text-sm cursor-pointer">
                {t("ingredientCascade.toggleAll")}
              </label>
            </div>

            <div className="space-y-2">
              {pagedItems.map((it) => (
                <div key={it.id} className="border border-border rounded-lg p-3 bg-card">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-body font-medium">{it.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">{it.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {stores.map((s) => (
                        <label key={s.slug} className="flex items-center gap-1.5 text-xs font-body">
                          <Switch
                            checked={!!selection[it.id]?.[s.slug]}
                            onCheckedChange={(v) =>
                              setSelection((prev) => ({
                                ...prev,
                                [it.id]: { ...(prev[it.id] || {}), [s.slug]: v },
                              }))
                            }
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  {t("ingredientCascade.prev")}
                </Button>
                <span className="text-xs font-body text-muted-foreground">
                  {t("ingredientCascade.pageOf", { page: page + 1, total: totalPages })}
                </span>
                <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  {t("ingredientCascade.next")}
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            {t("ingredientCascade.skip")}
          </Button>
          <Button onClick={handleConfirm} disabled={submitting || loading || items.length === 0}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t("ingredientCascade.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IngredientCascadeDialog;
