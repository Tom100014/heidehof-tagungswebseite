CREATE EXTENSION IF NOT EXISTS pg_net;

INSERT INTO public.app_settings (key, value, updated_at)
VALUES
  ('cartesia_system_prompt', '""'::jsonb, now()),
  ('cartesia_agent_last_sync',
    jsonb_build_object('at', now(), 'success', false, 'mode', 'manual_copy', 'note', 'Noch nicht generiert'),
    now())
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.regenerate_cartesia_prompt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN v_record_id := OLD.id::text; ELSE v_record_id := NEW.id::text; END IF;
  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/update-cartesia-prompt',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('source','db_trigger','table',TG_TABLE_NAME,'event',TG_OP,'record_id',v_record_id)
  );
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_food_menu_cartesia_prompt ON public.food_menu;
DROP TRIGGER IF EXISTS trg_cartesia_prompt_food ON public.food_menu;
CREATE TRIGGER trg_food_menu_cartesia_prompt
  AFTER INSERT OR UPDATE OR DELETE ON public.food_menu
  FOR EACH ROW EXECUTE FUNCTION public.regenerate_cartesia_prompt();

DROP TRIGGER IF EXISTS trg_drinks_menu_cartesia_prompt ON public.drinks_menu;
DROP TRIGGER IF EXISTS trg_cartesia_prompt_drinks ON public.drinks_menu;
CREATE TRIGGER trg_drinks_menu_cartesia_prompt
  AFTER INSERT OR UPDATE OR DELETE ON public.drinks_menu
  FOR EACH ROW EXECUTE FUNCTION public.regenerate_cartesia_prompt();

DROP TRIGGER IF EXISTS trg_wellness_treatments_cartesia_prompt ON public.wellness_treatments;
DROP TRIGGER IF EXISTS trg_cartesia_prompt_wellness ON public.wellness_treatments;
CREATE TRIGGER trg_wellness_treatments_cartesia_prompt
  AFTER INSERT OR UPDATE OR DELETE ON public.wellness_treatments
  FOR EACH ROW EXECUTE FUNCTION public.regenerate_cartesia_prompt();