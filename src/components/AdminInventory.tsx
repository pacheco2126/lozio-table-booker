import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInventoryAccess, StoreSlug } from "@/hooks/useInventoryAccess";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pencil, Trash2, Plus, Loader2, ShoppingCart, ClipboardList, Package,
  ChevronDown, AlertOctagon, Search, X, AlertTriangle,
} from "lucide-react";
import IngredientCascadeDialog from "@/components/admin/IngredientCascadeDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stores: string[];
  low_stock_threshold: number;
  target_quantity: number | null;
  notes: string | null;
  is_active: boolean;
  sort_order: number;
}

interface StockRow {
  item_id: string;
  store: string;
  quantity: number;
  updated_at: string;
}

interface LastMovement {
  item_id: string;
  store: string;
  type: string;
  resulting_quantity: number;
  created_at: string;
  created_by: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORE_LABELS: Record<StoreSlug, string> = {
  tarragona:   "Lo Zio Tarragona",
  arrabassada: "Lo Zio Arrabassada",
  rincon:      "El Rincón",
};

export const CATEGORY_LABELS: Record<string, string> = {
  masa_harinas:       "Masa y harinas",
  quesos:             "Quesos",
  tomate_salsas:      "Tomate y salsas",
  embutidos_carnes:   "Embutidos y carnes",
  verduras:           "Verduras",
  pescado:            "Pescado",
  bebidas:            "Bebidas",
  aceites_condimentos:"Aceites y condimentos",
  packaging:          "Packaging",
  limpieza:           "Limpieza",
  otros:              "Otros",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

const ALL_STORES: StoreSlug[] = ["tarragona", "arrabassada", "rincon"];

const emptyItem = (): Omit<InventoryItem, "id"> => ({
  name: "",
  category: "otros",
  unit: "uds",
  stores: ["tarragona", "arrabassada"],
  low_stock_threshold: 0,
  target_quantity: null,
  notes: null,
  is_active: true,
  sort_order: 0,
});

// ─── Component ───────────────────────────────────────────────────────────────

const AdminInventory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stores, canManageCatalog, loading: accessLoading } = useInventoryAccess();

  const [selectedStore, setSelectedStore] = useState<StoreSlug | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [lastMovements, setLastMovements] = useState<Record<string, LastMovement>>({});
  const [loadingData, setLoadingData] = useState(false);

  // Catalog management state
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<InventoryItem, "id">>(emptyItem());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Recount / purchase dialogs
  const [recountItem, setRecountItem] = useState<InventoryItem | null>(null);
  const [purchaseItem, setPurchaseItem] = useState<InventoryItem | null>(null);
  const [actionValue, setActionValue] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Collapsed categories
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Name filter
  const [nameFilter, setNameFilter] = useState("");
  const [showOutPanel, setShowOutPanel] = useState(false);

  // Ingredient cascade dialog
  const [cascadeItem, setCascadeItem] = useState<InventoryItem | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ─── Guard: redirect if no inventory access ──────────────────────────────
  useEffect(() => {
    if (!accessLoading && stores.length === 0) {
      navigate("/");
    }
  }, [accessLoading, stores, navigate]);

  // ─── Pick default store ───────────────────────────────────────────────────
  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0]);
    }
  }, [stores, selectedStore]);

  // ─── Fetch items + stock ──────────────────────────────────────────────────
  const fetchData = useCallback(async (store: StoreSlug) => {
    setLoadingData(true);
    const [{ data: itemData }, { data: stockData }, { data: moveData }] =
      await Promise.all([
        supabase
          .from("inventory_items")
          .select("*")
          .contains("stores", [store])
          .eq("is_active", true)
          .order("category")
          .order("sort_order"),
        supabase
          .from("inventory_stock")
          .select("item_id, store, quantity, updated_at")
          .eq("store", store),
        supabase
          .from("inventory_movements")
          .select("item_id, store, type, resulting_quantity, created_at, created_by")
          .eq("store", store)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

    setItems((itemData as InventoryItem[]) ?? []);

    const stockMap: Record<string, number> = {};
    (stockData as StockRow[] ?? []).forEach((r) => {
      stockMap[r.item_id] = r.quantity;
    });
    setStock(stockMap);

    const moveMap: Record<string, LastMovement> = {};
    ((moveData as LastMovement[]) ?? []).forEach((m) => {
      if (!moveMap[m.item_id]) moveMap[m.item_id] = m;
    });
    setLastMovements(moveMap);

    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (!selectedStore) return;
    fetchData(selectedStore);
  }, [selectedStore, fetchData]);

  // ─── Realtime: live stock updates ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedStore) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`inventory-stock-${selectedStore}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_stock",
          filter: `store=eq.${selectedStore}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as StockRow;
          if (!row?.item_id) return;
          if (payload.eventType === "DELETE") {
            setStock((prev) => {
              const next = { ...prev };
              delete next[row.item_id];
              return next;
            });
          } else {
            setStock((prev) => ({ ...prev, [row.item_id]: row.quantity }));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [selectedStore]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const toggleCat = (cat: string) =>
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const closeItemDialog = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyItem());
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      stores: item.stores,
      low_stock_threshold: item.low_stock_threshold,
      target_quantity: item.target_quantity,
      notes: item.notes,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const qty = (itemId: string) => stock[itemId] ?? 0;
  const isLow = (item: InventoryItem) => qty(item.id) <= item.low_stock_threshold;

  // ─── Catalog CRUD ─────────────────────────────────────────────────────────
  const handleSaveItem = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (form.stores.length === 0) { toast.error("Selecciona al menos un local"); return; }

    const payload = {
      ...form,
      name: form.name.trim(),
      notes: form.notes?.trim() || null,
      target_quantity: form.target_quantity ?? null,
    };

    if (editing) {
      const { error } = await supabase.from("inventory_items").update(payload).eq("id", editing.id);
      if (error) { toast.error("Error al guardar: " + error.message); return; }
      toast.success("Artículo actualizado");
    } else {
      const { error } = await supabase.from("inventory_items").insert(payload);
      if (error) { toast.error("Error al crear: " + error.message); return; }
      toast.success("Artículo creado");
    }
    closeItemDialog();
    if (selectedStore) fetchData(selectedStore);
  };

  const handleDeleteItem = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("inventory_items").delete().eq("id", deleteId);
    if (error) toast.error("Error al eliminar: " + error.message);
    else { toast.success("Artículo eliminado"); if (selectedStore) fetchData(selectedStore); }
    setDeleteId(null);
  };

  // ─── Stock movements ──────────────────────────────────────────────────────
  const handleMovement = async (type: "recount" | "purchase") => {
    const item = type === "recount" ? recountItem : purchaseItem;
    if (!item || !selectedStore) return;

    const parsed = parseFloat(actionValue.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) { toast.error("Introduce un número válido"); return; }

    setSubmitting(true);
    const { error } = await supabase.rpc("apply_inventory_movement", {
      p_item_id: item.id,
      p_store:   selectedStore,
      p_type:    type === "recount" ? "recount" : "purchase",
      p_value:   parsed,
      p_note:    actionNote.trim() || null,
    });
    setSubmitting(false);

    if (error) { toast.error("Error: " + error.message); return; }

    const msg = type === "recount"
      ? `Recuento guardado: ${parsed} ${item.unit}`
      : `Entrada registrada: +${parsed} ${item.unit}`;
    toast.success(msg);

    setRecountItem(null);
    setPurchaseItem(null);
    setActionValue("");
    setActionNote("");
    if (selectedStore) fetchData(selectedStore);
  };

  // ─── Grouped items ────────────────────────────────────────────────────────
  const normalize = (v: string) =>
    v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const nf = normalize(nameFilter.trim());
  const visibleItems = nf ? items.filter((i) => normalize(i.name).includes(nf)) : items;

  const grouped = CATEGORIES.reduce<Record<string, InventoryItem[]>>((acc, cat) => {
    const catItems = visibleItems.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const lowItems = items.filter(isLow);
  const outItems = items.filter((i) => qty(i.id) <= 0);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Store selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {stores.length === 1 ? (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="font-body font-semibold">{selectedStore ? STORE_LABELS[selectedStore] : ""}</span>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-body gap-2">
                <Package className="w-4 h-4" />
                {selectedStore ? STORE_LABELS[selectedStore] : "Seleccionar local"}
                <ChevronDown className="w-4 h-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              {stores.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSelectedStore(s)}>
                  {STORE_LABELS[s]}
                  {selectedStore === s && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {canManageCatalog && (
          <Button
            size="sm"
            onClick={() => setCreating(true)}
            className="font-body gap-1 ml-auto"
          >
            <Plus className="w-4 h-4" /> Nuevo artículo
          </Button>
        )}
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="inventario">
        <TabsList className="font-body">
          <TabsTrigger value="inventario" className="font-bold gap-1">
            <ClipboardList className="w-4 h-4" /> Inventario
          </TabsTrigger>
          <TabsTrigger value="comprar" className="font-bold gap-1">
            <ShoppingCart className="w-4 h-4" />
            Para comprar
            {lowItems.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {lowItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Inventario ── */}
        <TabsContent value="inventario" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Buscar ingrediente por nombre…"
              className="pl-9 font-body"
            />
            {nameFilter && (
              <button
                onClick={() => setNameFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Limpiar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {outItems.length > 0 && (
            <Collapsible open={showOutPanel} onOpenChange={setShowOutPanel}>
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <span className="font-body text-sm text-amber-900 dark:text-amber-100">
                        Tienes <strong>{outItems.length}</strong> ingrediente{outItems.length === 1 ? "" : "s"} agotado{outItems.length === 1 ? "" : "s"} (stock 0)
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-amber-700 dark:text-amber-400 transition-transform ${showOutPanel ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-3 space-y-1.5 max-h-64 overflow-y-auto">
                    {outItems.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-3 text-sm font-body py-1.5 border-t border-amber-200/60 dark:border-amber-800/60">
                        <div className="min-w-0">
                          <span className="font-medium text-foreground">{it.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{CATEGORY_LABELS[it.category] ?? it.category}</span>
                        </div>
                        <button
                          onClick={() => { setNameFilter(it.name); setShowOutPanel(false); }}
                          className="text-xs text-primary hover:underline shrink-0"
                        >
                          Ver
                        </button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground font-body py-10">
              No hay artículos para este local.
            </p>
          ) : (
            Object.entries(grouped).map(([cat, catItems]) => (
              <Collapsible
                key={cat}
                open={!collapsedCats.has(cat)}
                onOpenChange={() => toggleCat(cat)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors font-body font-semibold text-sm">
                    <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${collapsedCats.has(cat) ? "" : "rotate-180"}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1 mt-1">
                    {catItems.map((item) => {
                      const q = qty(item.id);
                      const low = isLow(item);
                      const last = lastMovements[item.id];
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-card/80"
                        >
                          {/* Name + meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-body font-medium text-foreground">{item.name}</span>
                              {low && (
                                <Badge variant="destructive" className="text-xs">
                                  Bajo mínimo
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="text-xl font-display font-bold text-foreground tabular-nums">
                                {q}
                              </span>
                              <span className="text-sm text-muted-foreground font-body">{item.unit}</span>
                              {item.low_stock_threshold > 0 && (
                                <span className="text-xs text-muted-foreground font-body">
                                  mín. {item.low_stock_threshold}
                                </span>
                              )}
                              {last && (
                                <span className="text-xs text-muted-foreground font-body">
                                  · últ. {last.type === "recount" ? "recuento" : last.type === "purchase" ? "entrada" : last.type} {formatDate(last.created_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              className="font-body"
                              onClick={() => { setRecountItem(item); setActionValue(String(q)); setActionNote(""); }}
                            >
                              Recuento
                            </Button>
                            <Button
                              size="sm"
                              className="font-body"
                              onClick={() => { setPurchaseItem(item); setActionValue(""); setActionNote(""); }}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Entrada
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="font-body gap-1 text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950"
                              onClick={() => setCascadeItem(item)}
                              title="Marcar agotado y desactivar productos que lo usan"
                            >
                              <AlertOctagon className="w-3.5 h-3.5" /> Agotado
                            </Button>
                            {canManageCatalog && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteId(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </TabsContent>

        {/* ── Para comprar ── */}
        <TabsContent value="comprar" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground font-body">
              Artículos por debajo del mínimo en {selectedStore ? STORE_LABELS[selectedStore] : "este local"}.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="font-body"
              onClick={() => window.print()}
            >
              Imprimir lista
            </Button>
          </div>

          {lowItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl mb-2">✓</p>
              <p className="font-body text-muted-foreground">
                Todo el stock está por encima del mínimo.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {lowItems.sort((a, b) => a.category.localeCompare(b.category)).map((item) => {
                const q = qty(item.id);
                const needed = item.target_quantity
                  ? Math.max(0, item.target_quantity - q)
                  : Math.max(0, item.low_stock_threshold - q + 1);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {CATEGORY_LABELS[item.category]} · hay {q} {item.unit} · mín. {item.low_stock_threshold}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-destructive text-lg tabular-nums">
                        +{needed}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">{item.unit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Recount dialog ── */}
      <Dialog
        open={!!recountItem}
        onOpenChange={(o) => { if (!o) { setRecountItem(null); setActionValue(""); setActionNote(""); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Recuento de stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="font-body text-muted-foreground text-sm">
              <strong>{recountItem?.name}</strong> — {selectedStore ? STORE_LABELS[selectedStore] : ""}
            </p>
            <div>
              <Label className="font-body">¿Cuántas {recountItem?.unit} hay ahora?</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                className="font-body text-2xl text-center h-14 mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label className="font-body text-muted-foreground text-sm">Nota (opcional)</Label>
              <Textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Ej: revisado antes de cierre"
                className="font-body mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRecountItem(null); setActionValue(""); setActionNote(""); }}>
              Cancelar
            </Button>
            <Button onClick={() => handleMovement("recount")} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar recuento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Purchase/entrada dialog ── */}
      <Dialog
        open={!!purchaseItem}
        onOpenChange={(o) => { if (!o) { setPurchaseItem(null); setActionValue(""); setActionNote(""); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Registrar entrada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="font-body text-muted-foreground text-sm">
              <strong>{purchaseItem?.name}</strong> — {selectedStore ? STORE_LABELS[selectedStore] : ""}
            </p>
            <div>
              <Label className="font-body">¿Cuántas {purchaseItem?.unit} añades?</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                className="font-body text-2xl text-center h-14 mt-1"
                autoFocus
              />
              <p className="text-xs text-muted-foreground font-body mt-1">
                Stock actual: {purchaseItem ? qty(purchaseItem.id) : 0} {purchaseItem?.unit}
              </p>
            </div>
            <div>
              <Label className="font-body text-muted-foreground text-sm">Nota (opcional)</Label>
              <Textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Ej: pedido proveedor #38"
                className="font-body mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPurchaseItem(null); setActionValue(""); setActionNote(""); }}>
              Cancelar
            </Button>
            <Button onClick={() => handleMovement("purchase")} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar entrada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Catalog item create/edit dialog ── */}
      <Dialog open={!!editing || creating} onOpenChange={(o) => { if (!o) closeItemDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Editar artículo" : "Nuevo artículo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-body">Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="font-body mt-1"
                />
              </div>
              <div>
                <Label className="font-body">Unidad de medida</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg, uds, botes, L…"
                  className="font-body mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="font-body">Categoría</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-body mt-1"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="font-body">Locales</Label>
              <div className="flex gap-3 mt-2 flex-wrap">
                {ALL_STORES.map((s) => (
                  <label key={s} className="flex items-center gap-1.5 font-body text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.stores.includes(s)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.stores, s]
                          : form.stores.filter((x) => x !== s);
                        setForm({ ...form, stores: next });
                      }}
                      className="rounded"
                    />
                    {STORE_LABELS[s]}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-body">Mínimo (reposición)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: parseFloat(e.target.value) || 0 })}
                  className="font-body mt-1"
                />
              </div>
              <div>
                <Label className="font-body">Objetivo (opcional)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.target_quantity ?? ""}
                  onChange={(e) => setForm({ ...form, target_quantity: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="—"
                  className="font-body mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="font-body">Orden</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="font-body mt-1 w-28"
              />
            </div>

            <div>
              <Label className="font-body">Notas internas (opcional)</Label>
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
                className="font-body mt-1 resize-none"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label className="font-body">Artículo activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeItemDialog}>Cancelar</Button>
            <Button onClick={handleSaveItem}>
              {editing ? "Guardar cambios" : "Crear artículo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Se eliminará el artículo del catálogo y todo su historial de movimientos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <IngredientCascadeDialog
        open={!!cascadeItem}
        onOpenChange={(o) => { if (!o) setCascadeItem(null); }}
        inventoryItemId={cascadeItem?.id ?? null}
        inventoryItemName={cascadeItem?.name}
        defaultStoreSlug={selectedStore}
      />
    </div>
  );
};

export default AdminInventory;
