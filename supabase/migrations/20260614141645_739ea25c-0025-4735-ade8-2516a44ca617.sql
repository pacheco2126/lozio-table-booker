
-- Revoke EXECUTE from PUBLIC on all public SECURITY DEFINER functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', r.sig);
  END LOOP;
END $$;

-- Targeted grants: client-callable RPCs need authenticated; reservation availability needs anon too
GRANT EXECUTE ON FUNCTION public.find_available_tables_multi(text, date, time, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_available_table(text, date, time, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_discounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assigned_discount(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_discount_preview(citext, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_inventory_movement(uuid, text, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
-- can_insert_order_item is invoked inside RLS policy evaluation as the caller role
GRANT EXECUTE ON FUNCTION public.can_insert_order_item(uuid) TO anon, authenticated;
-- Helpers used inside other SECURITY DEFINER functions (no direct API call) but RLS may reference them
GRANT EXECUTE ON FUNCTION public.can_access_store(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_inventory_catalog(uuid) TO authenticated;
