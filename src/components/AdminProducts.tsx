import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Check, X, Store as StoreIcon, Clock, Carrot } from "lucide-react";
import { EU_ALLERGENS } from "@/lib/allergens";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_active: boolean | null;
  allergens: string[] | null;
  badge_key: string | null;
  badge_emoji: string | null;
  badge_style: string | null;
  sort_order: number | null;
}

const CATEGORIES = ["pizzas", "focaccias", "calzones", "extras", "drinks", "desserts"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  pizzas: "Pizzas", focaccias: "Focaccias", calzones: "Calzones",
  extras: "Extras", drinks: "Bebidas", desserts: "Postres",
};
const BADGE_STYLES = ["", "fire", "gold", "teal"] as const;
const INGREDIENT_LINKABLE = new Set(["pizzas", "focaccias", "calzones"]);
const PAGE_SIZE = 10;

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  description: "",
  price: 0,
  category: "pizzas",
  is_active: true,
  allergens: [],
  badge_key: null,
  badge_emoji: null,
  badge_style: null,
  sort_order: 0,
};

interface StoreRow { slug: string; name: string; accepts_delivery: boolean; accepts_pickup: boolean; }
interface AvailabilityRow { menu_item_id: string; store_slug: string; is_available: boolean; unavailable_until: string | null; }
interface InventoryItemRow { id: string; name: string; category: string; is_active: boolean; }
interface IngredientLink { menu_item_id: string; inventory_item_id: string; }

type AvailabilityMap = Record<string, AvailabilityRow>; // key = `${menu_item_id}__${store_slug}`
const availKey = (itemId: string, slug: string) => `${itemId}__${slug}`;

function isAvailableNow(row?: AvailabilityRow): boolean {
  if (!row) return true; // default available
  if (row.unavailable_until && new Date(row.unavailable_until) <= new Date()) return true;
  return row.is_available;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState("");
  const [disableTarget, setDisableTarget] = useState<{ product: Product; store: StoreRow } | null>(null);
  const [linkingProduct, setLinkingProduct] = useState<Product | null>(null);
  const [linkSelection, setLinkSelection] = useState<Set<string>>(new Set());
  const [inventoryItems, setInventoryItems] = useState<InventoryItemRow[]>([]);
  const [ingredientsByProduct, setIngredientsByProduct] = useState<Record<string, Set<string>>>({});


  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [productsRes, storesRes, availRes, invRes, linkRes] = await Promise.all([
      supabase.from("menu_items").select("*").order("category").order("sort_order"),
      supabase.from("stores").select("slug,name,accepts_delivery,accepts_pickup").eq("is_active", true).order("sort_order"),
      supabase.from("menu_item_store_availability").select("menu_item_id,store_slug,is_available,unavailable_until"),
      supabase.from("inventory_items").select("id,name,category,is_active").eq("is_active", true).order("category").order("name"),
      supabase.from("menu_item_ingredients").select("menu_item_id,inventory_item_id"),
    ]);
    if (productsRes.error) toast.error("Error al cargar productos");
    if (storesRes.error) toast.error("Error al cargar locales");
    setProducts((productsRes.data as Product[]) || []);
    const orderingStores = ((storesRes.data as StoreRow[]) || []).filter(s => s.accepts_delivery || s.accepts_pickup);
    setStores(orderingStores);
    const map: AvailabilityMap = {};
    ((availRes.data as AvailabilityRow[]) || []).forEach(r => { map[availKey(r.menu_item_id, r.store_slug)] = r; });
    setAvailability(map);
    setInventoryItems((invRes.data as InventoryItemRow[]) || []);
    const byProduct: Record<string, Set<string>> = {};
    ((linkRes.data as IngredientLink[]) || []).forEach(l => {
      if (!byProduct[l.menu_item_id]) byProduct[l.menu_item_id] = new Set();
      byProduct[l.menu_item_id].add(l.inventory_item_id);
    });
    setIngredientsByProduct(byProduct);
    setLoading(false);
  };




  const openLinking = (p: Product) => {
    setLinkingProduct(p);
    setLinkSelection(new Set(ingredientsByProduct[p.id] ?? []));
  };

  const saveIngredientLinks = async () => {
    if (!linkingProduct) return;
    const current = ingredientsByProduct[linkingProduct.id] ?? new Set<string>();
    const toAdd = Array.from(linkSelection).filter(id => !current.has(id));
    const toRemove = Array.from(current).filter(id => !linkSelection.has(id));
    if (toAdd.length > 0) {
      const rows = toAdd.map(id => ({ menu_item_id: linkingProduct.id, inventory_item_id: id }));
      const { error } = await supabase.from("menu_item_ingredients").insert(rows);
      if (error) { toast.error("Error al vincular: " + error.message); return; }
    }
    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("menu_item_ingredients")
        .delete()
        .eq("menu_item_id", linkingProduct.id)
        .in("inventory_item_id", toRemove);
      if (error) { toast.error("Error al desvincular: " + error.message); return; }
    }
    toast.success("Ingredientes actualizados");
    setLinkingProduct(null);
    fetchAll();
  };

  const fetchProducts = fetchAll;


  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description ?? "", price: Number(p.price),
      category: p.category, is_active: p.is_active ?? true,
      allergens: p.allergens ?? [], badge_key: p.badge_key, badge_emoji: p.badge_emoji,
      badge_style: p.badge_style, sort_order: p.sort_order ?? 0,
    });
  };

  const openCreate = () => {
    setCreating(true);
    setForm({ ...emptyProduct, category: filterCategory !== "all" ? filterCategory : "pizzas" });
  };

  const closeDialog = () => { setEditing(null); setCreating(false); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (form.price < 0) { toast.error("Precio inválido"); return; }

    const payload = {
      ...form,
      description: form.description?.trim() || null,
      badge_key: form.badge_key?.trim() || null,
      badge_emoji: form.badge_emoji?.trim() || null,
      badge_style: form.badge_style || null,
    };

    if (editing) {
      const { error } = await supabase.from("menu_items").update(payload).eq("id", editing.id);
      if (error) { toast.error("Error al guardar: " + error.message); return; }
      toast.success("Producto actualizado");
    } else {
      const { error } = await supabase.from("menu_items").insert(payload);
      if (error) { toast.error("Error al crear: " + error.message); return; }
      toast.success("Producto creado");
    }
    closeDialog();
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", deleteId);
    if (error) { toast.error("Error al eliminar: " + error.message); }
    else { toast.success("Producto eliminado"); fetchProducts(); }
    setDeleteId(null);
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase.from("menu_items").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast.error("Error: " + error.message);
    else { toast.success(p.is_active ? "Producto oculto" : "Producto visible"); fetchProducts(); }
  };

  const enableAtStore = async (product: Product, store: StoreRow) => {
    const { error } = await supabase
      .from("menu_item_store_availability")
      .upsert({ menu_item_id: product.id, store_slug: store.slug, is_available: true, unavailable_until: null }, { onConflict: "menu_item_id,store_slug" });
    if (error) { toast.error("Error: " + error.message); return; }
    toast.success(`Disponible en ${store.name}`);
    fetchAll();
  };

  const disableAtStore = async (product: Product, store: StoreRow, until: Date | null) => {
    const { error } = await supabase
      .from("menu_item_store_availability")
      .upsert({
        menu_item_id: product.id,
        store_slug: store.slug,
        is_available: false,
        unavailable_until: until ? until.toISOString() : null,
      }, { onConflict: "menu_item_id,store_slug" });
    if (error) { toast.error("Error: " + error.message); return; }
    toast.success(until ? `Oculto en ${store.name} hasta mañana` : `Desactivado en ${store.name}`);
    setDisableTarget(null);
    fetchAll();
  };

  const nextOpenAt = (_store: StoreRow): Date => {
    // 19:00 next day; storeHours handles closed days but for "hasta mañana" we use literal mañana 19:00
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return d;
  };




  const saveInlinePrice = async (id: string) => {
    const v = parseFloat(inlinePriceValue);
    if (isNaN(v) || v < 0) { toast.error("Precio inválido"); return; }
    const { error } = await supabase.from("menu_items").update({ price: v }).eq("id", id);
    if (error) toast.error("Error: " + error.message);
    else { toast.success("Precio actualizado"); setInlinePriceId(null); fetchProducts(); }
  };

  const toggleAllergen = (id: string) => {
    setForm((f) => {
      const list = f.allergens ?? [];
      return { ...f, allergens: list.includes(id) ? list.filter((a) => a !== id) : [...list, id] };
    });
  };

  const filtered = filterCategory === "all" ? products : products.filter((p) => p.category === filterCategory);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [filterCategory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-foreground">Productos del menú</h2>
          <p className="font-body text-sm text-muted-foreground">Edita precios, descripciones y disponibilidad.</p>
        </div>
        <Button onClick={openCreate} className="font-body">
          <Plus className="w-4 h-4 mr-2" /> Nuevo producto
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-body transition-colors ${filterCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >Todos ({products.length})</button>
        {CATEGORIES.map((c) => {
          const count = products.filter((p) => p.category === c).length;
          return (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 rounded-full text-sm font-body capitalize transition-colors ${filterCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >{CATEGORY_LABELS[c] ?? c} ({count})</button>
          );
        })}
      </div>

      {loading ? (
        <p className="font-body text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-muted-foreground text-center py-8">Sin productos.</p>
      ) : (
        <div className="grid gap-3">
          {paginated.map((p) => (
            <div key={p.id} className={`border border-border rounded-lg p-4 bg-card ${!p.is_active ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-lg text-foreground">{p.name}</h3>
                    <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[p.category] ?? p.category}</Badge>
                    {p.badge_emoji && <span className="text-base">{p.badge_emoji}</span>}
                    {!p.is_active && <Badge variant="secondary" className="text-xs">Oculto</Badge>}
                  </div>
                  {p.description && <p className="font-body text-sm text-muted-foreground mt-1">{p.description}</p>}
                  {p.allergens && p.allergens.length > 0 && (
                    <p className="font-body text-xs text-muted-foreground mt-1">Alérgenos: {p.allergens.join(", ")}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {inlinePriceId === p.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" step="0.01" min="0"
                        value={inlinePriceValue}
                        onChange={(e) => setInlinePriceValue(e.target.value)}
                        className="w-24 h-9"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={() => saveInlinePrice(p.id)}><Check className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setInlinePriceId(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setInlinePriceId(p.id); setInlinePriceValue(String(p.price)); }}
                      className="font-display text-xl text-primary hover:underline"
                      title="Click para editar precio"
                    >{Number(p.price).toFixed(2)} €</button>
                  )}

                  <Switch checked={!!p.is_active} onCheckedChange={() => toggleActive(p)} />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openLinking(p)}
                    title="Vincular ingredientes"
                  >
                    <Carrot className={`w-4 h-4 ${(ingredientsByProduct[p.id]?.size ?? 0) > 0 ? "text-amber-600" : ""}`} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>

              {stores.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                    <StoreIcon className="w-3.5 h-3.5" /> Disponibilidad por local:
                  </span>
                  {stores.map((s) => {
                    const row = availability[availKey(p.id, s.slug)];
                    const available = isAvailableNow(row);
                    const until = row?.unavailable_until ? new Date(row.unavailable_until) : null;
                    const reactivatesSoon = !available && until && until > new Date();
                    return (
                      <div key={s.slug} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                        <span className="text-xs font-body">{s.name}</span>
                        <Switch
                          checked={available}
                          onCheckedChange={(v) => {
                            if (v) enableAtStore(p, s);
                            else setDisableTarget({ product: p, store: s });
                          }}
                        />
                        {reactivatesSoon && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400">
                            <Clock className="w-3 h-3" />
                            {until!.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={!!editing || creating} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-body"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Precio (€)</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end gap-2">
                <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="mb-2">Visible</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Badge (texto)</Label>
                <Input value={form.badge_key ?? ""} onChange={(e) => setForm({ ...form, badge_key: e.target.value })} placeholder="Ej: NUEVA" />
              </div>
              <div>
                <Label>Emoji</Label>
                <Input value={form.badge_emoji ?? ""} onChange={(e) => setForm({ ...form, badge_emoji: e.target.value })} placeholder="🔥" />
              </div>
              <div>
                <Label>Estilo badge</Label>
                <select
                  value={form.badge_style ?? ""}
                  onChange={(e) => setForm({ ...form, badge_style: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-body"
                >
                  {BADGE_STYLES.map((s) => <option key={s} value={s}>{s || "ninguno"}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label>Alérgenos</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EU_ALLERGENS.map((a) => {
                  const selected = (form.allergens ?? []).includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAllergen(a.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-body transition-colors ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >{a.emoji} {a.name}</button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!disableTarget} onOpenChange={(o) => !o && setDisableTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Desactivar producto</DialogTitle>
            <DialogDescription>
              {disableTarget && (
                <>¿Cómo quieres desactivar <strong>{disableTarget.product.name}</strong> en <strong>{disableTarget.store.name}</strong>?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Button
              variant="outline"
              className="w-full justify-start font-body"
              onClick={() => disableTarget && disableAtStore(disableTarget.product, disableTarget.store, nextOpenAt(disableTarget.store))}
            >
              <Clock className="w-4 h-4 mr-2" /> Solo hasta mañana (19:00)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start font-body"
              onClick={() => disableTarget && disableAtStore(disableTarget.product, disableTarget.store, null)}
            >
              <X className="w-4 h-4 mr-2" /> Desactivar indefinidamente
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDisableTarget(null)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkingProduct} onOpenChange={(o) => !o && setLinkingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Carrot className="w-5 h-5 text-amber-600" />
              Ingredientes vinculados
            </DialogTitle>
            <DialogDescription>
              {linkingProduct && <>Selecciona los ingredientes que componen <strong>{linkingProduct.name}</strong>. Se usarán para la cascada al marcar un ingrediente como agotado.</>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[55vh] overflow-y-auto">
            {inventoryItems.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body text-center py-6">
                No hay ingredientes en el inventario.
              </p>
            ) : (
              Object.entries(
                inventoryItems.reduce<Record<string, InventoryItemRow[]>>((acc, it) => {
                  (acc[it.category] ||= []).push(it);
                  return acc;
                }, {})
              ).map(([cat, list]) => (
                <div key={cat}>
                  <p className="text-xs font-body uppercase tracking-wider text-muted-foreground mb-1.5">{cat}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {list.map((it) => {
                      const selected = linkSelection.has(it.id);
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => {
                            setLinkSelection((prev) => {
                              const next = new Set(prev);
                              next.has(it.id) ? next.delete(it.id) : next.add(it.id);
                              return next;
                            });
                          }}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-body text-left transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-muted/70"
                          }`}
                        >
                          {it.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkingProduct(null)}>Cancelar</Button>
            <Button onClick={saveIngredientLinks}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
