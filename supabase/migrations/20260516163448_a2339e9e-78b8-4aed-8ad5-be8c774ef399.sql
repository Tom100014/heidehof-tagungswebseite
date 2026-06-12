
-- 1. Drafts table
CREATE TABLE IF NOT EXISTS public.lead_email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.lead_campaigns(id) ON DELETE SET NULL,
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  ai_generated_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  sent_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_drafts_status ON public.lead_email_drafts(status);
CREATE INDEX IF NOT EXISTS idx_lead_drafts_campaign ON public.lead_email_drafts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_drafts_lead ON public.lead_email_drafts(lead_id);

ALTER TABLE public.lead_email_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage lead drafts" ON public.lead_email_drafts;
CREATE POLICY "admins manage lead drafts"
  ON public.lead_email_drafts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP TRIGGER IF EXISTS trg_lead_drafts_touch ON public.lead_email_drafts;
CREATE TRIGGER trg_lead_drafts_touch
  BEFORE UPDATE ON public.lead_email_drafts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Automation table
CREATE TABLE IF NOT EXISTS public.lead_automation (
  campaign_id uuid PRIMARY KEY REFERENCES public.lead_campaigns(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  send_hour_start integer NOT NULL DEFAULT 9,
  send_hour_end integer NOT NULL DEFAULT 18,
  daily_cap integer NOT NULL DEFAULT 25,
  weekdays integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  last_run_at timestamptz,
  last_run_stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_automation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage automation" ON public.lead_automation;
CREATE POLICY "admins manage automation"
  ON public.lead_automation FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP TRIGGER IF EXISTS trg_lead_automation_touch ON public.lead_automation;
CREATE TRIGGER trg_lead_automation_touch
  BEFORE UPDATE ON public.lead_automation
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-assets','lead-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read lead-assets" ON storage.objects;
CREATE POLICY "public read lead-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lead-assets');

DROP POLICY IF EXISTS "admins write lead-assets" ON storage.objects;
CREATE POLICY "admins write lead-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-assets' AND has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "admins update lead-assets" ON storage.objects;
CREATE POLICY "admins update lead-assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lead-assets' AND has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "admins delete lead-assets" ON storage.objects;
CREATE POLICY "admins delete lead-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lead-assets' AND has_role(auth.uid(),'admin'::app_role));
