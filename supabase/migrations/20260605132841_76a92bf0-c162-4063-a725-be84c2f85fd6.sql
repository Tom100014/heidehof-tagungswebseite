
-- Extend leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_score int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS do_not_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_role text,
  ADD COLUMN IF NOT EXISTS employee_count int,
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'DE';

CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- pipeline_deals
CREATE TABLE IF NOT EXISTS public.pipeline_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead','first_contact','qualified','viewing_offer','negotiation','won','lost')),
  estimated_value numeric(12,2) NOT NULL DEFAULT 0,
  event_type text,
  expected_persons int,
  expected_date date,
  probability int NOT NULL DEFAULT 10 CHECK (probability BETWEEN 0 AND 100),
  room_interest uuid[] NOT NULL DEFAULT '{}',
  notes text,
  owner_id uuid,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_deals TO authenticated;
GRANT ALL ON public.pipeline_deals TO service_role;
ALTER TABLE public.pipeline_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage deals" ON public.pipeline_deals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.pipeline_deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_lead ON public.pipeline_deals(lead_id);
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.pipeline_deals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- email_sequences (new richer model alongside legacy lead_sequences)
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.lead_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_sequences TO authenticated;
GRANT ALL ON public.email_sequences TO service_role;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sequences" ON public.email_sequences FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_seq_updated BEFORE UPDATE ON public.email_sequences FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  wait_days int NOT NULL DEFAULT 3,
  template_key text,
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequence_steps TO authenticated;
GRANT ALL ON public.sequence_steps TO service_role;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage seq steps" ON public.sequence_steps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- email_events
CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  draft_id uuid REFERENCES public.lead_email_drafts(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.lead_campaigns(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('sent','delivered','opened','clicked','bounced','replied','unsubscribed','complained')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read events" ON public.email_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins insert events" ON public.email_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_email_events_lead ON public.email_events(lead_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON public.email_events(type, occurred_at DESC);

-- lead_activities (chronological log)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.pipeline_deals(id) ON DELETE SET NULL,
  actor_id uuid,
  type text NOT NULL CHECK (type IN ('email','call','note','status_change','stage_change','enrichment','score_change','system')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage activities" ON public.lead_activities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id, occurred_at DESC);
