CREATE OR REPLACE FUNCTION public.regenerate_cartesia_prompt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id::text;
  ELSE
    v_record_id := NEW.id::text;
  END IF;

  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/update-cartesia-prompt',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'source', 'db_trigger',
      'table', TG_TABLE_NAME,
      'event', TG_OP,
      'record_id', v_record_id
    )
  );

  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/cartesia-tools-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'source', 'db_trigger',
      'table', TG_TABLE_NAME,
      'event', TG_OP,
      'record_id', v_record_id
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_update_cartesia_prompt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/update-cartesia-prompt',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('source', TG_TABLE_NAME, 'op', TG_OP)
  );
  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/cartesia-tools-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('source', TG_TABLE_NAME, 'op', TG_OP)
  );
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;