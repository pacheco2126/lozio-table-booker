
ALTER TABLE public.menu_items 
  ADD COLUMN IF NOT EXISTS image_key text,
  ADD COLUMN IF NOT EXISTS free_extras integer;

UPDATE public.menu_items 
  SET name='CREA TU PIZZA', image_key='FANTASÍA', free_extras=4
  WHERE name='FANTASÍA';
