CREATE TABLE IF NOT EXISTS public.phone_agent_calls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cartesia_call_id text NOT NULL UNIQUE,
  agent_id text NOT NULL,
  agent_name text,
  status text,
  direction text,
  from_number text,
  to_number text,
  started_at timestamptz,
  ended_at timestamptz,
  summary text,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL DEFAULT 'unknown',
  priority text NOT NULL DEFAULT 'normal',
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_agent_calls_agent_started
  ON public.phone_agent_calls(agent_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_phone_agent_calls_category
  ON public.phone_agent_calls(category, priority, started_at DESC);

ALTER TABLE public.phone_agent_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read phone agent calls"
  ON public.phone_agent_calls FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'director'::app_role));

CREATE POLICY "Service role manages phone agent calls"
  ON public.phone_agent_calls FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_phone_agent_calls_updated_at
  BEFORE UPDATE ON public.phone_agent_calls
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value, updated_at)
VALUES ('clara_cartesia_agent_id', '"agent_gjYusgM21heczyikufbJ4P"'::jsonb, now())
ON CONFLICT (key) DO NOTHING;
