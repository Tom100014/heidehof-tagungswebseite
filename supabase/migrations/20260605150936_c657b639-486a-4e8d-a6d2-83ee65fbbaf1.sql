-- 1) Fix FK: leads.enrolled_sequence_id soll auf email_sequences zeigen (dort liegen die Steps)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_enrolled_sequence_id_fkey;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_enrolled_sequence_id_fkey
  FOREIGN KEY (enrolled_sequence_id) REFERENCES public.email_sequences(id) ON DELETE SET NULL;

-- 2) Reply-Inbound-Log
CREATE TABLE IF NOT EXISTS public.lead_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.lead_campaigns(id) ON DELETE SET NULL,
  from_email text NOT NULL,
  from_name text,
  subject text,
  body_text text,
  body_html text,
  message_id text,
  in_reply_to text,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_auto_reply boolean NOT NULL DEFAULT false,
  sentiment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lead_replies TO authenticated;
GRANT ALL ON public.lead_replies TO service_role;
ALTER TABLE public.lead_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read replies" ON public.lead_replies FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_lead_replies_lead ON public.lead_replies(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_replies_email ON public.lead_replies(lower(from_email));

-- 3) Sequenz-Schritte um Subject/Body-Override ergänzen (optional zum Template)
ALTER TABLE public.sequence_steps
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS use_ai boolean NOT NULL DEFAULT true;

-- 4) email_sequences: Beschreibung
ALTER TABLE public.email_sequences
  ADD COLUMN IF NOT EXISTS description text;
