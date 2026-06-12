
CREATE TABLE IF NOT EXISTS public.phone_call_contexts (
  token text PRIMARY KEY,
  clara_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  phone_hint text,
  call_id text,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

GRANT SELECT ON public.phone_call_contexts TO authenticated;
GRANT ALL ON public.phone_call_contexts TO service_role;

ALTER TABLE public.phone_call_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read phone_call_contexts"
ON public.phone_call_contexts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_phone_call_contexts_created_at
  ON public.phone_call_contexts (created_at DESC);
