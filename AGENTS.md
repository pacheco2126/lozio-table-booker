# Architecture rules

- Use shared `fetchAllRows` (or its query-result adapter `fetchAllResult`) with a unique stable order for unbounded table and set-returning RPC reads; Data API responses are capped at 1,000 rows. Preserve explicit UI/history limits and operational queue batches.
- Load order line items independently through `orderQueries` rather than embedded list relations; embedded relations can also truncate and must not hide purchased items.