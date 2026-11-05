// One pagination implementation for the browser and order functions.
import { fetchAllRows } from "../../supabase/functions/_shared/pagination";
export { fetchAllRows };

/** Preserve the existing query-result contract for grouped queries. */
export async function fetchAllResult<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    return { data: await fetchAllRows(fetchPage), error: null };
  } catch (error) {
    const message = typeof error === "object" && error !== null && "message" in error
      ? String(error.message) : "Error loading data";
    return { data: null, error: new Error(message) };
  }
}