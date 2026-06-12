GRANT SELECT, INSERT, UPDATE, DELETE ON public.clara_conversations TO authenticated;
GRANT ALL ON public.clara_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clara_notes TO authenticated;
GRANT ALL ON public.clara_notes TO service_role;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_clara_conversations_updated_at ON public.clara_conversations;
CREATE TRIGGER trg_clara_conversations_updated_at
BEFORE UPDATE ON public.clara_conversations
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();