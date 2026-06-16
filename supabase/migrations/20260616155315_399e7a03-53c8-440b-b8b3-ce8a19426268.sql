CREATE TABLE public.delivery_min_order_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store text NOT NULL,
  max_km numeric(5,2) NOT NULL CHECK (max_km > 0),
  min_order_amount numeric(8,2) NOT NULL CHECK (min_order_amount >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.delivery_min_order_tiers TO anon, authenticated;
GRANT ALL ON public.delivery_min_order_tiers TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.delivery_min_order_tiers TO authenticated;

ALTER TABLE public.delivery_min_order_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read delivery tiers"
  ON public.delivery_min_order_tiers FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert delivery tiers"
  ON public.delivery_min_order_tiers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update delivery tiers"
  ON public.delivery_min_order_tiers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete delivery tiers"
  ON public.delivery_min_order_tiers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_delivery_min_order_tiers_updated_at
  BEFORE UPDATE ON public.delivery_min_order_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX delivery_min_order_tiers_store_idx
  ON public.delivery_min_order_tiers (store, max_km);

-- Seed defaults: 0-3 km → 9.50€, 3-6 km → 15€, 6-10 km → 20€ per store
INSERT INTO public.delivery_min_order_tiers (store, max_km, min_order_amount, sort_order) VALUES
  ('tarragona',   3,  9.50, 1),
  ('tarragona',   6, 15.00, 2),
  ('tarragona',  10, 20.00, 3),
  ('arrabassada', 3,  9.50, 1),
  ('arrabassada', 6, 15.00, 2),
  ('arrabassada',10, 20.00, 3),
  ('rincon',      3,  9.50, 1),
  ('rincon',      6, 15.00, 2),
  ('rincon',     10, 20.00, 3);