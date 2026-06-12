
-- Leads: replied/bounced + sequence enrollment
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrolled_sequence_id uuid REFERENCES public.lead_sequences(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enrolled_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enrolled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_leads_next_action ON public.leads(next_action_at) WHERE next_action_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_enrolled ON public.leads(enrolled_sequence_id) WHERE enrolled_sequence_id IS NOT NULL;

-- Drafts: tracking token (used in pixel/click URLs)
ALTER TABLE public.lead_email_drafts
  ADD COLUMN IF NOT EXISTS tracking_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_drafts_tracking_token ON public.lead_email_drafts(tracking_token);

-- Inbound log
CREATE TABLE IF NOT EXISTS public.lead_inbound_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_record_id uuid,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.pipeline_deals(id) ON DELETE SET NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lead_inbound_log TO authenticated;
GRANT ALL ON public.lead_inbound_log TO service_role;

ALTER TABLE public.lead_inbound_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read inbound log" ON public.lead_inbound_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Enrichment queue
CREATE TABLE IF NOT EXISTS public.lead_enrichment_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.lead_enrichment_queue TO authenticated;
GRANT ALL ON public.lead_enrichment_queue TO service_role;

ALTER TABLE public.lead_enrichment_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage enrichment queue" ON public.lead_enrichment_queue
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status ON public.lead_enrichment_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_lead ON public.lead_enrichment_queue(lead_id);

DROP TRIGGER IF EXISTS trg_enrichment_queue_updated ON public.lead_enrichment_queue;
CREATE TRIGGER trg_enrichment_queue_updated BEFORE UPDATE ON public.lead_enrichment_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
