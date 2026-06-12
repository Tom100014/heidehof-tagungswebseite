
CREATE OR REPLACE FUNCTION public.forward_inquiry_to_lead_inbound()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/lead-inbound',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('source','tagungs_inquiry','inquiry_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_inquiry_to_lead_inbound ON public.tagungs_inquiries;
CREATE TRIGGER trg_inquiry_to_lead_inbound
AFTER INSERT ON public.tagungs_inquiries
FOR EACH ROW EXECUTE FUNCTION public.forward_inquiry_to_lead_inbound();
