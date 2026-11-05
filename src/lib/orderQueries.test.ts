import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOrderItems, fetchOrdersWithItems } from "./orderQueries";

const db = vi.hoisted(() => ({ items: [] as { id: string; order_id: string }[], groups: [] as string[][] }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => {
    let ids: string[] = [];
    const query = {
      select: () => query,
      eq: (_column: string, id: string) => { ids = [id]; return query; },
      in: (_column: string, values: string[]) => { ids = values; db.groups.push(values); return query; },
      order: () => query,
      range: async (from: number, to: number) => ({
        data: db.items.filter(item => ids.includes(item.order_id)).slice(from, to + 1), error: null,
      }),
    };
    return query;
  } },
}));

beforeEach(() => { db.items = []; db.groups = []; });

describe("complete order reads", () => {
  it("loads 1015 pickup and delivery orders with all 2045 line items", async () => {
    const orders = Array.from({ length: 1015 }, (_, i) => ({
      id: String(i), order_type: i % 2 ? "pickup" : "delivery", created_at: "2026-11-05T10:00:00Z",
    }));
    db.items = Array.from({ length: 2045 }, (_, i) => ({ id: String(i), order_id: String(i % 1015) }));
    const result = await fetchOrdersWithItems(async (from, to) => ({ data: orders.slice(from, to + 1), error: null }));
    expect(result).toHaveLength(1015);
    expect(result.flatMap(order => order.order_items)).toHaveLength(2045);
    expect(result.find(order => order.id === "1014")?.order_items).toHaveLength(2);
    expect(result.filter(order => order.order_type === "delivery")).toHaveLength(508);
    expect(db.groups.every(ids => ids.length <= 100)).toBe(true);
  });

  it("does not truncate 1015 line items belonging to one order", async () => {
    db.items = Array.from({ length: 1015 }, (_, i) => ({ id: String(i), order_id: "one" }));
    expect(await fetchOrderItems("one")).toEqual(db.items);
    const result = await fetchOrdersWithItems(async () => ({ data: [{ id: "one" }], error: null }));
    expect(result[0]?.order_items).toEqual(db.items);
  });
});