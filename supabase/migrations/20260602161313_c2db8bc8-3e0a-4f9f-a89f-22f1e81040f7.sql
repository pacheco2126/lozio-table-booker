ALTER TABLE public.inventory_items DROP CONSTRAINT inventory_items_category_check;
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_category_check
  CHECK (category = ANY (ARRAY[
    'masa_harinas','quesos','tomate_salsas','embutidos_carnes',
    'verduras','pescado','bebidas','aceites_condimentos',
    'packaging','limpieza','otros'
  ]));