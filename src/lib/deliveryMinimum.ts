import { supabase } from "@/integrations/supabase/client";
import { STORE_COORDS, haversineKm, geocodeAddress } from "@/lib/nearestStore";

export interface DeliveryTier {
  id: string;
  store: string;
  max_km: number;
  min_order_amount: number;
  sort_order: number;
}

export interface DeliveryMinimumResult {
  store: string;
  distanceKm: number;
  minOrderAmount: number | null; // null = out of range (no tier matches)
  matchedTier: DeliveryTier | null;
  maxKmConfigured: number;
}

export async function fetchTiersForStore(store: string): Promise<DeliveryTier[]> {
  const { data, error } = await supabase
    .from("delivery_min_order_tiers")
    .select("id, store, max_km, min_order_amount, sort_order")
    .eq("store", store)
    .order("max_km", { ascending: true });
  if (error) {
    console.warn("[deliveryMinimum] fetchTiers error:", error);
    return [];
  }
  return (data ?? []) as DeliveryTier[];
}

export async function fetchAllTiers(): Promise<DeliveryTier[]> {
  const { data, error } = await supabase
    .from("delivery_min_order_tiers")
    .select("id, store, max_km, min_order_amount, sort_order")
    .order("store", { ascending: true })
    .order("max_km", { ascending: true });
  if (error) {
    console.warn("[deliveryMinimum] fetchAllTiers error:", error);
    return [];
  }
  return (data ?? []) as DeliveryTier[];
}

/**
 * Given a delivery address, returns the minimum order amount required
 * based on straight-line distance to the assigned store.
 */
export async function computeDeliveryMinimum(
  store: string,
  address: string,
  city: string,
  postalCode: string,
): Promise<DeliveryMinimumResult | null> {
  const storeCoords = STORE_COORDS[store];
  if (!storeCoords) return null;

  const coords = await geocodeAddress(address, city, postalCode);
  if (!coords) return null;

  const distanceKm = haversineKm(coords.lat, coords.lng, storeCoords.lat, storeCoords.lng);
  const tiers = await fetchTiersForStore(store);
  const maxKmConfigured = tiers.reduce((m, t) => Math.max(m, t.max_km), 0);

  // Find the smallest tier whose max_km >= distance
  const matched = tiers.find((t) => distanceKm <= t.max_km) ?? null;

  return {
    store,
    distanceKm,
    minOrderAmount: matched ? matched.min_order_amount : null,
    matchedTier: matched,
    maxKmConfigured,
  };
}
