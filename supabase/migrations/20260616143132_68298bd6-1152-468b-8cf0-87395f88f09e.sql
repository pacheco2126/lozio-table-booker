
-- Internal config table for shared secrets used by triggers + edge functions
CREATE TABLE IF NOT EXISTS public.internal_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.internal_config FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.internal_config TO service_role;
ALTER TABLE public.internal_config ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (BYPASSRLS) can read/write.

INSERT INTO public.internal_config(key, value) VALUES
  ('edge_shared_secret', '014b65961c0287b78ef743dc6afae3b44ddc36bf2f5704bb2dbd82013357336e')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Update trigger functions to use shared secret instead of vault service role
CREATE OR REPLACE FUNCTION public.notify_user_push_on_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  shared_secret text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('confirmed','preparing','ready','out_for_delivery','delivered') THEN RETURN NEW; END IF;

  SELECT value INTO shared_secret FROM public.internal_config WHERE key='edge_shared_secret' LIMIT 1;

  PERFORM net.http_post(
    url := 'https://lnrnyahzkqqnvlpzrdlv.supabase.co/functions/v1/notify-user-order',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || COALESCE(shared_secret,'')
    ),
    body := jsonb_build_object('record', row_to_json(NEW)::jsonb, 'old_record', row_to_json(OLD)::jsonb),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_user_push_on_order_status failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;
