
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  shared_secret text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('confirmed','cancelled') THEN
    RETURN NEW;
  END IF;

  SELECT value INTO shared_secret FROM public.internal_config WHERE key = 'edge_shared_secret' LIMIT 1;

  PERFORM net.http_post(
    url := 'https://lnrnyahzkqqnvlpzrdlv.supabase.co/functions/v1/notify-order-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(shared_secret, '')
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)::jsonb,
      'old_record', row_to_json(OLD)::jsonb
    ),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_order_status_change failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;
