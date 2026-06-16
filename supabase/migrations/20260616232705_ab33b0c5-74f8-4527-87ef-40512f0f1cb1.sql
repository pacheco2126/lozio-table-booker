
-- =====================================================
-- 1) STORES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stores (
  slug text PRIMARY KEY,
  name text NOT NULL,
  accepts_delivery boolean NOT NULL DEFAULT false,
  accepts_pickup boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stores"
  ON public.stores FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert stores"
  ON public.stores FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update stores"
  ON public.stores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stores"
  ON public.stores FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.stores (slug, name, accepts_delivery, accepts_pickup, is_active, sort_order) VALUES
  ('tarragona',   'Pizzeria Lo Zio Tarragona',   true,  true,  true, 1),
  ('arrabassada', 'Pizzeria Lo Zio Arrabassada', true,  true,  true, 2),
  ('rincon',      'El Rincón de Lo Zio',          false, false, true, 3)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2) BACKFILL menu_items.slug WHERE NULL (prefixed by category)
-- =====================================================
UPDATE public.menu_items
SET slug = (
  CASE category
    WHEN 'pizzas'    THEN 'pizza_'
    WHEN 'focaccias' THEN 'focaccia_'
    WHEN 'calzones'  THEN 'calzone_'
    ELSE category || '_'
  END
) || lower(
  regexp_replace(
    regexp_replace(
      translate(name,
        'ÁÀÄÂÃáàäâãÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñÇç',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'
      ),
      '[^a-zA-Z0-9]+', '_', 'g'
    ),
    '^_+|_+$', '', 'g'
  )
)
WHERE slug IS NULL;

-- =====================================================
-- 3) menu_item_store_availability
-- =====================================================
CREATE TABLE IF NOT EXISTS public.menu_item_store_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  store_slug text NOT NULL REFERENCES public.stores(slug) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT true,
  unavailable_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (menu_item_id, store_slug)
);

CREATE INDEX IF NOT EXISTS menu_item_store_availability_store_idx
  ON public.menu_item_store_availability (store_slug);

GRANT SELECT ON public.menu_item_store_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_item_store_availability TO authenticated;
GRANT ALL ON public.menu_item_store_availability TO service_role;

ALTER TABLE public.menu_item_store_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
  ON public.menu_item_store_availability FOR SELECT
  USING (true);

CREATE POLICY "Admins manage availability"
  ON public.menu_item_store_availability FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER menu_item_store_availability_updated_at
  BEFORE UPDATE ON public.menu_item_store_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4) menu_item_ingredients
-- =====================================================
CREATE TABLE IF NOT EXISTS public.menu_item_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (menu_item_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS menu_item_ingredients_inv_idx
  ON public.menu_item_ingredients (inventory_item_id);
CREATE INDEX IF NOT EXISTS menu_item_ingredients_menu_idx
  ON public.menu_item_ingredients (menu_item_id);

GRANT SELECT ON public.menu_item_ingredients TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_item_ingredients TO authenticated;
GRANT ALL ON public.menu_item_ingredients TO service_role;

ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ingredient links"
  ON public.menu_item_ingredients FOR SELECT
  USING (true);

CREATE POLICY "Admins manage ingredient links"
  ON public.menu_item_ingredients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
