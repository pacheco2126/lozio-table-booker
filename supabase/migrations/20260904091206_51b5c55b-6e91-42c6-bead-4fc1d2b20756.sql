ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS orders_paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS orders_paused_until timestamptz;