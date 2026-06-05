import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type StoreSlug = "tarragona" | "arrabassada" | "rincon";

export interface InventoryAccess {
  stores: StoreSlug[];
  canManageCatalog: boolean;
  loading: boolean;
}

const CACHE_KEY = "lozio_inventory_access";

const FULL_STORES: StoreSlug[] = ["tarragona", "arrabassada", "rincon"];

const STORE_ROLE_MAP: Record<string, StoreSlug> = {
  pizzeriaTarragona:   "tarragona",
  pizzeriaArrabassada: "arrabassada",
  pizzeriaRincon:      "rincon",
};

function readCache(): InventoryAccess | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InventoryAccess;
  } catch {
    return null;
  }
}

function writeCache(v: InventoryAccess) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(v));
  } catch { /* ignore */ }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch { /* ignore */ }
}

export const useInventoryAccess = (): InventoryAccess => {
  const { user, loading: authLoading } = useAuth();

  const cached = readCache();
  const [access, setAccess] = useState<InventoryAccess>(
    cached ?? { stores: [], canManageCatalog: false, loading: true }
  );
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (authLoading) { setLoading(true); return; }

    if (!user) {
      clearCache();
      const v: InventoryAccess = { stores: [], canManageCatalog: false, loading: false };
      setAccess(v);
      setLoading(false);
      return;
    }

    if (cached) setLoading(false);

    const check = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = (data ?? []).map((r) => r.role as string);
      const isPrivileged = roles.includes("god") || roles.includes("admin");
      const stores: StoreSlug[] = isPrivileged
        ? FULL_STORES
        : (Object.entries(STORE_ROLE_MAP)
            .filter(([role]) => roles.includes(role))
            .map(([, slug]) => slug));

      const v: InventoryAccess = {
        stores,
        canManageCatalog: isPrivileged,
        loading: false,
      };
      setAccess(v);
      setLoading(false);
      if (stores.length > 0) writeCache(v);
      else clearCache();
    };

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  return { ...access, loading };
};
