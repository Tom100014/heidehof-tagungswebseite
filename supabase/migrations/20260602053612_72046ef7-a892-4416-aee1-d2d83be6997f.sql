-- 1) Clara Session Memory
CREATE TABLE IF NOT EXISTS public.clara_session_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, key)
);

CREATE INDEX IF NOT EXISTS idx_clara_session_memory_session ON public.clara_session_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_clara_session_memory_updated ON public.clara_session_memory(updated_at DESC);

GRANT SELECT ON public.clara_session_memory TO authenticated;
GRANT ALL ON public.clara_session_memory TO service_role;

ALTER TABLE public.clara_session_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read session memory"
  ON public.clara_session_memory FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger für updated_at
CREATE TRIGGER trg_clara_session_memory_updated
  BEFORE UPDATE ON public.clara_session_memory
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Cartesia Call Log
CREATE TABLE IF NOT EXISTS public.cartesia_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id text,
  agent_id text,
  tool_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cartesia_call_log_created ON public.cartesia_call_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cartesia_call_log_tool ON public.cartesia_call_log(tool_name);

GRANT SELECT ON public.cartesia_call_log TO authenticated;
GRANT ALL ON public.cartesia_call_log TO service_role;

ALTER TABLE public.cartesia_call_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read call log"
  ON public.cartesia_call_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));