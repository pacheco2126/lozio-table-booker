import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Save, Truck } from "lucide-react";
import type { DeliveryTier } from "@/lib/deliveryMinimum";

const STORES: { id: string; label: string }[] = [
  { id: "tarragona", label: "Tarragona" },
  { id: "arrabassada", label: "Arrabassada" },
  { id: "rincon", label: "El Rincón" },
];

interface DraftTier {
  id?: string;
  store: string;
  max_km: number;
  min_order_amount: number;
  sort_order: number;
  _dirty?: boolean;
  _new?: boolean;
}

export default function AdminDeliveryMinimums() {
  const [tiers, setTiers] = useState<DraftTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStore, setActiveStore] = useState<string>("tarragona");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("delivery_min_order_tiers")
      .select("*")
      .order("store")
      .order("max_km");
    if (error) {
      toast.error("Error al cargar tramos");
    } else {
      setTiers((data ?? []) as DeliveryTier[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const tiersForStore = (store: string) =>
    tiers
      .filter((t) => t.store === store)
      .sort((a, b) => a.max_km - b.max_km);

  const updateTier = (idx: number, patch: Partial<DraftTier>) => {
    setTiers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch, _dirty: true };
      return next;
    });
  };

  const addTier = (store: string) => {
    const existing = tiersForStore(store);
    const lastKm = existing.length > 0 ? existing[existing.length - 1].max_km : 0;
    setTiers((prev) => [
      ...prev,
      {
        store,
        max_km: lastKm + 3,
        min_order_amount: 9.5,
        sort_order: existing.length + 1,
        _new: true,
        _dirty: true,
      },
    ]);
  };

  const removeTier = async (idx: number) => {
    const tier = tiers[idx];
    if (tier.id) {
      const { error } = await supabase
        .from("delivery_min_order_tiers")
        .delete()
        .eq("id", tier.id);
      if (error) {
        toast.error("Error al eliminar");
        return;
      }
    }
    setTiers((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Tramo eliminado");
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const dirty = tiers.filter((t) => t._dirty);
      for (const t of dirty) {
        if (t.max_km <= 0 || t.min_order_amount < 0) {
          toast.error("Valores inválidos");
          setSaving(false);
          return;
        }
        const payload = {
          store: t.store,
          max_km: t.max_km,
          min_order_amount: t.min_order_amount,
          sort_order: t.sort_order,
        };
        if (t._new) {
          const { error } = await supabase
            .from("delivery_min_order_tiers")
            .insert(payload);
          if (error) throw error;
        } else if (t.id) {
          const { error } = await supabase
            .from("delivery_min_order_tiers")
            .update(payload)
            .eq("id", t.id);
          if (error) throw error;
        }
      }
      toast.success("Cambios guardados");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const hasDirty = tiers.some((t) => t._dirty);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-menu-teal" />
            Pedido mínimo por distancia
          </h2>
          <p className="text-muted-foreground text-sm font-body mt-1">
            Configura el importe mínimo de pedido a domicilio según los kilómetros
            (en línea recta) desde cada pizzería. Las direcciones fuera del último
            tramo no podrán pedir a domicilio en ese local.
          </p>
        </div>
        <Button
          onClick={saveAll}
          disabled={!hasDirty || saving}
          className="bg-menu-teal hover:bg-menu-teal/90 text-menu-teal-foreground"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      <Tabs value={activeStore} onValueChange={setActiveStore}>
        <TabsList className="font-body">
          {STORES.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="font-bold">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STORES.map((s) => (
          <TabsContent key={s.id} value={s.id} className="mt-4">
            <Card className="p-4 md:p-6">
              {loading ? (
                <p className="text-muted-foreground text-sm">Cargando...</p>
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-[1fr_1fr_auto] gap-3 mb-2 px-1">
                    <Label className="text-xs text-muted-foreground">
                      Hasta (km)
                    </Label>
                    <Label className="text-xs text-muted-foreground">
                      Pedido mínimo (€)
                    </Label>
                    <span />
                  </div>
                  <div className="space-y-3">
                    {tiersForStore(s.id).length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No hay tramos configurados. Sin tramos, no se aceptan
                        pedidos a domicilio en este local.
                      </p>
                    )}
                    {tiersForStore(s.id).map((tier) => {
                      const idx = tiers.indexOf(tier);
                      return (
                        <div
                          key={tier.id ?? `new-${idx}`}
                          className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center"
                        >
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={tier.max_km}
                            onChange={(e) =>
                              updateTier(idx, {
                                max_km: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={tier.min_order_amount}
                            onChange={(e) =>
                              updateTier(idx, {
                                min_order_amount:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTier(idx)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => addTier(s.id)}
                    className="mt-4 w-full font-body"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Añadir tramo
                  </Button>
                </>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
