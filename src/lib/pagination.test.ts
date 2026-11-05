import { describe, expect, it } from "vitest";
import { fetchAllRows, fetchAllResult } from "./pagination";

describe("fetchAllRows", () => {
  it.each([0, 20, 1000, 1015, 2045])("returns all %i rows across the 1000-row API cap", async total => {
    const rows = Array.from({ length: total }, (_, id) => ({ id }));
    const ranges: number[][] = [];
    const result = await fetchAllRows(async (from, to) => {
      ranges.push([from, to]);
      return { data: rows.slice(from, to + 1), error: null };
    });
    expect(result).toEqual(rows);
    expect(new Set(result.map(row => row.id)).size).toBe(total);
    expect(ranges).toEqual(Array.from({ length: Math.floor(total / 1000) + 1 }, (_, page) =>
      [page * 1000, page * 1000 + 999]));
  });

  it("rejects instead of publishing partial results when a later page fails", async () => {
    const failure = new Error("Second page failed");
    await expect(fetchAllRows(async from => from === 0
      ? { data: Array.from({ length: 1000 }, (_, id) => ({ id })), error: null }
      : { data: null, error: failure })).rejects.toBe(failure);
  });

  it("preserves complete query-result data beyond 1000 rows", async () => {
    const rows = Array.from({ length: 1015 }, (_, id) => ({ id }));
    const result = await fetchAllResult(async (from, to) => ({ data: rows.slice(from, to + 1), error: null }));
    expect(result).toEqual({ data: rows, error: null });
  });

  it("returns an error and no partial rows when any page fails", async () => {
    const result = await fetchAllResult(async from => from === 0
      ? { data: Array.from({ length: 1000 }, (_, id) => ({ id })), error: null }
      : { data: null, error: { message: "Page failed" } });
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("Page failed");
  });
});