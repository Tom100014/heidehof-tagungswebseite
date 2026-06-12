-- History/versioning for site_content + site_seo
CREATE TABLE IF NOT EXISTS public.site_content_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page text NOT NULL,
  section_key text NOT NULL,
  value_de text NOT NULL DEFAULT '',
  edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sch_page_key ON public.site_content_history(page, section_key, created_at DESC);
ALTER TABLE public.site_content_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage site_content_history" ON public.site_content_history
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger: snapshot previous value on update of site_content
CREATE OR REPLACE FUNCTION public.snapshot_site_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.value_de IS DISTINCT FROM NEW.value_de THEN
    INSERT INTO public.site_content_history(page, section_key, value_de, edited_by)
    VALUES (OLD.page, OLD.section_key, OLD.value_de, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_site_content ON public.site_content;
CREATE TRIGGER trg_snapshot_site_content
BEFORE UPDATE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.snapshot_site_content();