
-- ============================================================
-- 1) ORDERS: drop insecure public policies + add safe-defaults
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read orders by id" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update order payment status" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders with safe defaults" ON public.orders;

CREATE POLICY "Anyone can create orders with safe defaults"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND payment_status = 'pending'
  AND stripe_session_id IS NULL
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- ============================================================
-- 2) ORDER_ITEMS: drop public read/insert, add safe insert
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create items for own orders" ON public.order_items;
DROP POLICY IF EXISTS "Customers can create items for pending orders" ON public.order_items;

CREATE OR REPLACE FUNCTION public.can_insert_order_item(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id
      AND o.status = 'pending'
      AND o.payment_status = 'pending'
      AND o.stripe_session_id IS NULL
      AND (
        o.user_id = auth.uid()
        OR (o.user_id IS NULL AND o.created_at > now() - interval '15 minutes')
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_insert_order_item(uuid) TO anon, authenticated;

CREATE POLICY "Customers can create items for pending orders"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (public.can_insert_order_item(order_id));

-- ============================================================
-- 3) RESERVATIONS: add admin insert + tighten public insert
-- ============================================================
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can insert reservations" ON public.reservations;

CREATE POLICY "Anyone can create reservations"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND location IN ('tarragona','arrabassada','rincon')
);

CREATE POLICY "Admins can insert reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
