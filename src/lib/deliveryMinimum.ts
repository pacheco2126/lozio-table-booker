import { supabase } from "@/integrations/supabase/client";
import { STORE_COORDS, haversineKm, geocodeAddress } from "@/lib/nearestStore";
import { isStoreOpen } from "@/lib/storeHours";

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
  geocoded: boolean;
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

/**
 * Geocodes the address, picks the nearest OPEN store, and returns the
 * minimum order amount required for delivery based on configured tiers.
 */
export async function computeDeliveryMinimumForAddress(
  address: string,
  city: string,
  postalCode: string,
  at: Date = new Date(),
): Promise<DeliveryMinimumResult | null> {
  const coords = await geocodeAddress(address, city, postalCode);
  if (!coords) {
    return {
      store: "tarragona",
      distanceKm: 0,
      minOrderAmount: null,
      matchedTier: null,
      maxKmConfigured: 0,
      geocoded: false,
    };
  }

  // Pick nearest open store; fall back to overall nearest if none open
  const candidates = (["tarragona", "arrabassada"] as const).filter((s) =>
    isStoreOpen(s, at),
  );
  const pool = candidates.length > 0 ? candidates : (["tarragona", "arrabassada"] as const);

  const distances = pool.map((slug) => ({
    slug,
    km: haversineKm(coords.lat, coords.lng, STORE_COORDS[slug].lat, STORE_COORDS[slug].lng),
  }));
  distances.sort((a, b) => a.km - b.km);
  const nearest = distances[0];

  const tiers = await fetchTiersForStore(nearest.slug);
  const maxKmConfigured = tiers.reduce((m, t) => Math.max(m, t.max_km), 0);
  const matched = tiers.find((t) => nearest.km <= t.max_km) ?? null;

  return {
    store: nearest.slug,
    distanceKm: nearest.km,
    minOrderAmount: matched ? matched.min_order_amount : null,
    matchedTier: matched,
    maxKmConfigured,
    geocoded: true,
  };
}
