
CREATE OR REPLACE FUNCTION public.trigger_mews_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean := false;
  v_auto_inq boolean := false;
  v_auto_ord boolean := false;
  v_action text;
  v_kind text;
BEGIN
  SELECT enabled, COALESCE(auto_send_inquiries,false), COALESCE(auto_send_orders,false)
    INTO v_enabled, v_auto_inq, v_auto_ord
  FROM public.mews_settings
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF NOT COALESCE(v_enabled, false) THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'tagungs_inquiries' THEN
    IF NOT v_auto_inq THEN RETURN NEW; END IF;
    v_action := 'send_inquiry';
    v_kind := 'tagungs_inquiry';
  ELSIF TG_TABLE_NAME IN ('conference_orders','restaurant_orders','room_orders') THEN
    IF NOT v_auto_ord THEN RETURN NEW; END IF;
    v_action := 'send_order';
    v_kind := TG_TABLE_NAME;
  ELSE
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/mews-sync',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object(
      'action', v_action,
      'kind', v_kind,
      'source_table', TG_TABLE_NAME,
      'record_id', NEW.id,
      'auto', true
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mews_sync_tagungs_inquiries ON public.tagungs_inquiries;
CREATE TRIGGER mews_sync_tagungs_inquiries
AFTER INSERT ON public.tagungs_inquiries
FOR EACH ROW EXECUTE FUNCTION public.trigger_mews_sync();

DROP TRIGGER IF EXISTS mews_sync_conference_orders ON public.conference_orders;
CREATE TRIGGER mews_sync_conference_orders
AFTER INSERT ON public.conference_orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_mews_sync();

DROP TRIGGER IF EXISTS mews_sync_restaurant_orders ON public.restaurant_orders;
CREATE TRIGGER mews_sync_restaurant_orders
AFTER INSERT ON public.restaurant_orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_mews_sync();

DROP TRIGGER IF EXISTS mews_sync_room_orders ON public.room_orders;
CREATE TRIGGER mews_sync_room_orders
AFTER INSERT ON public.room_orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_mews_sync();
