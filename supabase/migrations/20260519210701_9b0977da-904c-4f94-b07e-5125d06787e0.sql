-- Drop old Lovable inventory structures
DROP FUNCTION IF EXISTS public.apply_inventory_movement(uuid, text, numeric, text) CASCADE;
DROP FUNCTION IF EXISTS public.apply_inventory_movement(text, uuid, numeric, text) CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.inventory_stock CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;

-- Helper functions
CREATE OR REPLACE FUNCTION public.can_manage_inventory_catalog(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'god') OR public.has_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.can_access_store(_user_id uuid, _store text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'god')
    OR public.has_role(_user_id, 'admin')
    OR (_store = 'tarragona'   AND public.has_role(_user_id, 'pizzeriaTarragona'))
    OR (_store = 'arrabassada' AND public.has_role(_user_id, 'pizzeriaArrabassada'))
    OR (_store = 'rincon'      AND public.has_role(_user_id, 'pizzeriaRincon'));
$$;

CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL DEFAULT 'uds',
  stores text[] NOT NULL DEFAULT '{}',
  low_stock_threshold numeric NOT NULL DEFAULT 0,
  target_quantity numeric NULL,
  notes text NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_items_category_check CHECK (
    category IN ('masa_harinas','quesos','tomate_salsas','embutidos_carnes',
      'verduras','bebidas','aceites_condimentos','packaging','limpieza','otros')
  ),
  CONSTRAINT inventory_items_stores_check CHECK (
    stores <@ ARRAY['tarragona','arrabassada','rincon']::text[]
  )
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_items_select" ON public.inventory_items FOR SELECT TO authenticated
  USING (public.can_manage_inventory_catalog(auth.uid())
    OR EXISTS (SELECT 1 FROM unnest(stores) s WHERE public.can_access_store(auth.uid(), s)));
CREATE POLICY "inventory_items_insert" ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_inventory_catalog(auth.uid()));
CREATE POLICY "inventory_items_update" ON public.inventory_items FOR UPDATE TO authenticated
  USING (public.can_manage_inventory_catalog(auth.uid()))
  WITH CHECK (public.can_manage_inventory_catalog(auth.uid()));
CREATE POLICY "inventory_items_delete" ON public.inventory_items FOR DELETE TO authenticated
  USING (public.can_manage_inventory_catalog(auth.uid()));
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.inventory_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  store text NOT NULL CHECK (store IN ('tarragona','arrabassada','rincon')),
  quantity numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, store)
);
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_stock_select" ON public.inventory_stock FOR SELECT TO authenticated
  USING (public.can_access_store(auth.uid(), store));
CREATE TRIGGER update_inventory_stock_updated_at BEFORE UPDATE ON public.inventory_stock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  store text NOT NULL CHECK (store IN ('tarragona','arrabassada','rincon')),
  type text NOT NULL CHECK (type IN ('purchase','recount','consumption','adjustment')),
  delta numeric NOT NULL,
  resulting_quantity numeric NOT NULL,
  note text NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_movements_select" ON public.inventory_movements FOR SELECT TO authenticated
  USING (public.can_access_store(auth.uid(), store));

CREATE OR REPLACE FUNCTION public.apply_inventory_movement(
  p_item_id uuid, p_store text, p_type text, p_value numeric, p_note text DEFAULT NULL
) RETURNS public.inventory_stock
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old numeric; v_new numeric; v_row public.inventory_stock;
BEGIN
  IF NOT public.can_access_store(auth.uid(), p_store) THEN
    RAISE EXCEPTION 'No autorizado para el local %', p_store USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_type NOT IN ('purchase','recount','consumption','adjustment') THEN
    RAISE EXCEPTION 'Tipo de movimiento inválido: %', p_type USING ERRCODE = 'check_violation';
  END IF;
  INSERT INTO public.inventory_stock (item_id, store, quantity)
    VALUES (p_item_id, p_store, 0) ON CONFLICT (item_id, store) DO NOTHING;
  SELECT quantity INTO v_old FROM public.inventory_stock
    WHERE item_id = p_item_id AND store = p_store FOR UPDATE;
  v_new := CASE p_type
    WHEN 'recount' THEN p_value
    WHEN 'purchase' THEN v_old + p_value
    WHEN 'consumption' THEN v_old - p_value
    WHEN 'adjustment' THEN v_old + p_value END;
  IF v_new < 0 THEN v_new := 0; END IF;
  UPDATE public.inventory_stock SET quantity = v_new, updated_at = now()
    WHERE item_id = p_item_id AND store = p_store RETURNING * INTO v_row;
  INSERT INTO public.inventory_movements (item_id, store, type, delta, resulting_quantity, note, created_by)
    VALUES (p_item_id, p_store, p_type, v_new - v_old, v_new, p_note, auth.uid());
  RETURN v_row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.apply_inventory_movement(uuid, text, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_inventory_movement(uuid, text, text, numeric, text) TO authenticated;

-- Extend reject_html_input for inventory tables
CREATE OR REPLACE FUNCTION public.reject_html_input()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE html_pat TEXT := '<[a-zA-Z/!]|javascript:|data:[a-zA-Z]';
BEGIN
  IF TG_TABLE_NAME = 'orders' THEN
    IF (NEW.guest_name IS NOT NULL AND NEW.guest_name ~* html_pat) OR
       (NEW.notes IS NOT NULL AND NEW.notes ~* html_pat) OR
       (NEW.delivery_address IS NOT NULL AND NEW.delivery_address ~* html_pat) OR
       (NEW.guest_phone IS NOT NULL AND NEW.guest_phone ~* html_pat) THEN
      RAISE EXCEPTION 'Input contains invalid characters' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'reservations' THEN
    IF (NEW.guest_name IS NOT NULL AND NEW.guest_name ~* html_pat) OR
       (NEW.notes IS NOT NULL AND NEW.notes ~* html_pat) OR
       (NEW.phone IS NOT NULL AND NEW.phone ~* html_pat) THEN
      RAISE EXCEPTION 'Input contains invalid characters' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'reviews' THEN
    IF (NEW.message IS NOT NULL AND NEW.message ~* html_pat) THEN
      RAISE EXCEPTION 'Input contains invalid characters' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'profiles' THEN
    IF (NEW.full_name IS NOT NULL AND NEW.full_name ~* html_pat) OR
       (NEW.address IS NOT NULL AND NEW.address ~* html_pat) OR
       (NEW.food_preferences IS NOT NULL AND NEW.food_preferences ~* html_pat) OR
       (NEW.internal_notes IS NOT NULL AND NEW.internal_notes ~* html_pat) THEN
      RAISE EXCEPTION 'Input contains invalid characters' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'inventory_items' THEN
    IF (NEW.name IS NOT NULL AND NEW.name ~* html_pat) OR
       (NEW.notes IS NOT NULL AND NEW.notes ~* html_pat) THEN
      RAISE EXCEPTION 'Input contains invalid characters' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'inventory_movements' THEN
    IF (NEW.note IS NOT NULL AND NEW.note ~* html_pat) THEN
      RAISE EXCEPTION 'Input contains invalid characters' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reject_html_inventory_items
  BEFORE INSERT OR UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.reject_html_input();
CREATE TRIGGER trg_reject_html_inventory_movements
  BEFORE INSERT OR UPDATE ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.reject_html_input();

-- Seed catalog
INSERT INTO public.inventory_items (name, category, unit, stores, low_stock_threshold, target_quantity, sort_order) VALUES
  ('Harina de trigo (tipo 00)','masa_harinas','kg',ARRAY['tarragona','arrabassada'],5,20,10),
  ('Harina de semolina','masa_harinas','kg',ARRAY['tarragona','arrabassada'],2,10,20),
  ('Pan de panini','masa_harinas','bolsas',ARRAY['arrabassada','rincon'],3,10,30),
  ('Levadura fresca','masa_harinas','uds',ARRAY['tarragona','arrabassada'],2,6,40),
  ('Mozzarella fior di latte','quesos','kg',ARRAY['tarragona','arrabassada'],3,10,10),
  ('Mozzarella di bufala','quesos','kg',ARRAY['tarragona','arrabassada'],1,4,20),
  ('Parmesano (rallado)','quesos','kg',ARRAY['tarragona','arrabassada'],1,3,30),
  ('Gorgonzola','quesos','kg',ARRAY['tarragona','arrabassada'],0.5,2,40),
  ('Queso emmental (lonchas)','quesos','kg',ARRAY['arrabassada','rincon'],1,3,50),
  ('Tomate San Marzano (lata)','tomate_salsas','botes',ARRAY['tarragona','arrabassada'],6,24,10),
  ('Concentrado de tomate','tomate_salsas','botes',ARRAY['tarragona','arrabassada'],2,8,20),
  ('Pesto genovese','tomate_salsas','botes',ARRAY['tarragona','arrabassada'],1,4,30),
  ('Salsa barbacoa','tomate_salsas','botes',ARRAY['arrabassada','rincon'],1,4,40),
  ('Mayonesa','tomate_salsas','botes',ARRAY['arrabassada','rincon'],1,4,50),
  ('Pepperoni (salamino piccante)','embutidos_carnes','kg',ARRAY['tarragona','arrabassada'],2,6,10),
  ('Jamón de Parma','embutidos_carnes','kg',ARRAY['tarragona','arrabassada'],1,3,20),
  ('Mortadela','embutidos_carnes','kg',ARRAY['tarragona','arrabassada','rincon'],1,3,30),
  ('Pollo a la plancha (prep.)','embutidos_carnes','kg',ARRAY['arrabassada','rincon'],1,3,40),
  ('Jamón York (lonchas)','embutidos_carnes','kg',ARRAY['arrabassada','rincon'],1,3,50),
  ('Anchoas','embutidos_carnes','latas',ARRAY['tarragona','arrabassada'],1,4,60),
  ('Rúcula fresca','verduras','bolsas',ARRAY['tarragona','arrabassada','rincon'],2,6,10),
  ('Tomates cherry','verduras','kg',ARRAY['tarragona','arrabassada','rincon'],1,4,20),
  ('Pimiento rojo (fresco)','verduras','kg',ARRAY['tarragona','arrabassada'],1,3,30),
  ('Cebolla','verduras','kg',ARRAY['tarragona','arrabassada','rincon'],2,5,40),
  ('Champiñones (frescos)','verduras','kg',ARRAY['tarragona','arrabassada'],1,3,50),
  ('Albahaca fresca','verduras','manojos',ARRAY['tarragona','arrabassada'],2,6,60),
  ('Lechuga / mix ensalada','verduras','bolsas',ARRAY['arrabassada','rincon'],2,6,70),
  ('Agua mineral (50cl)','bebidas','uds',ARRAY['tarragona','arrabassada','rincon'],12,48,10),
  ('Refresco lata (Coca-Cola etc.)','bebidas','uds',ARRAY['tarragona','arrabassada','rincon'],12,48,20),
  ('Cerveza (botella 33cl)','bebidas','uds',ARRAY['tarragona','arrabassada','rincon'],6,24,30),
  ('Vino tinto (botella)','bebidas','uds',ARRAY['tarragona','arrabassada'],3,12,40),
  ('Vino blanco (botella)','bebidas','uds',ARRAY['tarragona','arrabassada'],3,12,50),
  ('Aceite de oliva virgen extra','aceites_condimentos','L',ARRAY['tarragona','arrabassada','rincon'],2,6,10),
  ('Sal','aceites_condimentos','kg',ARRAY['tarragona','arrabassada','rincon'],1,3,20),
  ('Orégano seco','aceites_condimentos','botes',ARRAY['tarragona','arrabassada'],1,3,30),
  ('Guindilla / peperoncino','aceites_condimentos','botes',ARRAY['tarragona','arrabassada'],1,3,40),
  ('Pimienta negra','aceites_condimentos','botes',ARRAY['tarragona','arrabassada','rincon'],1,3,50),
  ('Cajas pizza (30 cm)','packaging','uds',ARRAY['tarragona','arrabassada'],20,100,10),
  ('Cajas pizza (40 cm)','packaging','uds',ARRAY['tarragona','arrabassada'],10,50,20),
  ('Bolsas delivery','packaging','uds',ARRAY['tarragona','arrabassada'],20,100,30),
  ('Servilletas','packaging','packs',ARRAY['tarragona','arrabassada','rincon'],5,20,40),
  ('Papel aluminio (rollo)','packaging','uds',ARRAY['tarragona','arrabassada','rincon'],2,6,50),
  ('Envases para llevar (rincon)','packaging','uds',ARRAY['rincon'],10,50,60),
  ('Detergente lavavajillas','limpieza','L',ARRAY['tarragona','arrabassada','rincon'],2,6,10),
  ('Bayetas / estropajos','limpieza','packs',ARRAY['tarragona','arrabassada','rincon'],2,6,20),
  ('Papel de cocina (rollos)','limpieza','rollos',ARRAY['tarragona','arrabassada','rincon'],4,12,30),
  ('Guantes desechables (caja)','limpieza','cajas',ARRAY['tarragona','arrabassada','rincon'],1,4,40),
  ('Desinfectante superficies','limpieza','L',ARRAY['tarragona','arrabassada','rincon'],1,4,50)
ON CONFLICT DO NOTHING;