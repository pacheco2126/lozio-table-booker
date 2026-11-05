import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/pagination";

export async function fetchOrderItems(orderId: string) {
  return fetchAllRows((from, to) => supabase.from("order_items")
    .select("*").eq("order_id", orderId).order("id").range(from, to));
}

/** Page line items separately: a nested relation has its own API row limit. */
export async function fetchOrdersWithItems<T extends { id: string }>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const orders = await fetchAllRows(fetchPage);
  const itemsByOrder = new Map<string, Awaited<ReturnType<typeof fetchOrderItems>>>();
  // Keep each URL small, even when an entire store history is loaded.
  for (let offset = 0; offset < orders.length; offset += 100) {
    const ids = orders.slice(offset, offset + 100).map(order => order.id);
    const items = await fetchAllRows((from, to) => supabase.from("order_items")
      .select("*").in("order_id", ids).order("id").range(from, to));
    for (const item of items) {
      const group = itemsByOrder.get(item.order_id) ?? [];
      group.push(item);
      itemsByOrder.set(item.order_id, group);
    }
  }
  return orders.map(order => ({ ...order, order_items: itemsByOrder.get(order.id) ?? [] }));
}