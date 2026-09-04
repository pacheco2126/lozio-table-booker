/**
 * Store order pause ("dejar de recibir pedidos") registry.
 *
 * A paused store behaves exactly like a closed store:
 *  - no pickup orders can be placed for it
 *  - it is excluded as a candidate for nearby delivery orders
 *
 * The state lives in `stores.orders_paused` / `stores.orders_paused_until`.
 * Because `isStoreOpen()` is synchronous, we keep a lightweight in-memory
 * cache that is hydrated on app start and kept fresh via realtime.
 */
import { supabase } from "@/integrations/supabase/client";

export interface StorePauseState {
  paused: boolean;
  /** null while paused === true means indefinite */
  until: string | null;
}

const cache = new Map<string, StorePauseState>();
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export function subscribeStorePauses(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getStorePauseState(slug: string): StorePauseState {
  return cache.get(slug) ?? { paused: false, until: null };
}

/** True if the store has pedidos paused at the given moment */
export function isStorePaused(slug: string, at: Date = new Date()): boolean {
  const state = cache.get(slug);
  if (!state?.paused) return false;
  if (!state.until) return true; // indefinite
  return at.getTime() < new Date(state.until).getTime();
}

export async function fetchStorePauses(): Promise<void> {
  const { data, error } = await supabase
    .from("stores")
    .select("slug, orders_paused, orders_paused_until");
  if (error) {
    console.warn("[storePause] fetch error:", error);
    return;
  }
  cache.clear();
  for (const row of data ?? []) {
    cache.set(row.slug, {
      paused: Boolean(row.orders_paused),
      until: row.orders_paused_until ?? null,
    });
  }
  notify();
}

/** Hydrate + keep in sync. Returns a cleanup function. */
export function initStorePauses(): () => void {
  void fetchStorePauses();

  const channel = supabase
    .channel("store-pauses")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "stores" },
      () => void fetchStorePauses(),
    )
    .subscribe();

  // Re-evaluate expiring pauses (1h / until closing) once a minute
  const interval = window.setInterval(notify, 60_000);

  return () => {
    supabase.removeChannel(channel);
    window.clearInterval(interval);
  };
}

/** Closing time of the current service day (23:30) */
export function getClosingTime(from: Date = new Date()): Date {
  const close = new Date(from);
  close.setHours(23, 30, 0, 0);
  if (close.getTime() <= from.getTime()) {
    // Already past closing — pause until tomorrow's closing
    close.setDate(close.getDate() + 1);
  }
  return close;
}

export type PauseOption = "1h" | "today" | "indefinite";

export async function setStorePause(
  slug: string,
  option: PauseOption | null,
): Promise<{ error: string | null }> {
  let payload: { orders_paused: boolean; orders_paused_until: string | null };

  if (option === null) {
    payload = { orders_paused: false, orders_paused_until: null };
  } else if (option === "1h") {
    payload = {
      orders_paused: true,
      orders_paused_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  } else if (option === "today") {
    payload = { orders_paused: true, orders_paused_until: getClosingTime().toISOString() };
  } else {
    payload = { orders_paused: true, orders_paused_until: null };
  }

  const { error } = await supabase.from("stores").update(payload).eq("slug", slug);
  if (error) return { error: error.message };
  await fetchStorePauses();
  return { error: null };
}
