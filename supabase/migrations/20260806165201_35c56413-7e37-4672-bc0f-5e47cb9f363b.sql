-- Internal trigger function: must never be callable via the API
REVOKE ALL ON FUNCTION public.notify_user_push_on_order_status() FROM anon, authenticated, PUBLIC;

-- Legacy, unused helper (superseded by find_available_tables_multi)
REVOKE ALL ON FUNCTION public.find_available_table(text, date, time without time zone, integer) FROM anon, authenticated, PUBLIC;