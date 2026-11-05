# Architecture rules

- Use the shared `fetchAllRows` pagination helper with a unique stable order for unbounded reviews and order reads; Data API responses are capped at 1,000 rows.
- Load order line items independently through `orderQueries` rather than embedded list relations; embedded relations can also truncate and must not hide purchased items.