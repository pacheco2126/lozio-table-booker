
-- 1) Allow new order status
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY['pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled']));

-- 2) Notification preferences on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_reservations boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_orders boolean NOT NULL DEFAULT true;

-- 3) Reservation reminder marker
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- 4) Trigger to notify user via push when an order status changes
CREATE OR REPLACE FUNCTION public.notify_user_push_on_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_role_key text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('confirmed','preparing','ready','out_for_delivery','delivered') THEN
    RETURN NEW;
  END IF;

  service_role_key := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='SUPABASE_SERVICE_ROLE_KEY' LIMIT 1);

  PERFORM net.http_post(
    url := 'https://lnrnyahzkqqnvlpzrdlv.supabase.co/functions/v1/notify-user-order',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || COALESCE(service_role_key,'')
    ),
    body := jsonb_build_object('record', row_to_json(NEW)::jsonb, 'old_record', row_to_json(OLD)::jsonb),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_user_push_on_order_status failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_push_on_order_status ON public.orders;
CREATE TRIGGER trg_notify_user_push_on_order_status
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_push_on_order_status();

-- 5) Enable pg_cron + pg_net (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
