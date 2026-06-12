-- Auto-regenerate Cartesia phone agent system prompt when menu changes.
-- Calls the update-cartesia-prompt edge function via pg_net after any
-- insert/update/delete on food_menu, drinks_menu, or wellness_treatments.

CREATE OR REPLACE FUNCTION public.trigger_update_cartesia_prompt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/update-cartesia-prompt',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('source', TG_TABLE_NAME, 'op', TG_OP)
  );
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_cartesia_prompt_food ON public.food_menu;
CREATE TRIGGER trg_cartesia_prompt_food
AFTER INSERT OR UPDATE OR DELETE ON public.food_menu
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_update_cartesia_prompt();

DROP TRIGGER IF EXISTS trg_cartesia_prompt_drinks ON public.drinks_menu;
CREATE TRIGGER trg_cartesia_prompt_drinks
AFTER INSERT OR UPDATE OR DELETE ON public.drinks_menu
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_update_cartesia_prompt();

DROP TRIGGER IF EXISTS trg_cartesia_prompt_wellness ON public.wellness_treatments;
CREATE TRIGGER trg_cartesia_prompt_wellness
AFTER INSERT OR UPDATE OR DELETE ON public.wellness_treatments
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_update_cartesia_prompt();