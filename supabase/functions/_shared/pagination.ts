/** Fetch every page; never return a silently truncated or partial result. */
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    if (!data) throw new Error("Missing pagination response");
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}