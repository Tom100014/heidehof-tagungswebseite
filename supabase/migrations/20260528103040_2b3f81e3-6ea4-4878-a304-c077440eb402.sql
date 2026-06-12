
CREATE TABLE IF NOT EXISTS public.clara_voice_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  persona text NOT NULL DEFAULT 'clara',
  context_category text,
  context_topic text,
  context_room text,
  context_section text,
  context_source text,
  context_trigger text,
  turns int NOT NULL DEFAULT 0,
  tokens_in int NOT NULL DEFAULT 0,
  tokens_out int NOT NULL DEFAULT 0,
  terminated_reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.clara_voice_sessions TO authenticated;
GRANT ALL ON public.clara_voice_sessions TO service_role;

ALTER TABLE public.clara_voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read voice sessions"
  ON public.clara_voice_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages voice sessions"
  ON public.clara_voice_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.clara_voice_turns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  turn_index int NOT NULL DEFAULT 0,
  user_text text,
  assistant_text text,
  tool_calls jsonb NOT NULL DEFAULT '[]'::jsonb,
  latency_ms int,
  tokens_in int NOT NULL DEFAULT 0,
  tokens_out int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clara_voice_turns_session ON public.clara_voice_turns(session_id, turn_index);

GRANT SELECT, INSERT ON public.clara_voice_turns TO authenticated;
GRANT ALL ON public.clara_voice_turns TO service_role;

ALTER TABLE public.clara_voice_turns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read voice turns"
  ON public.clara_voice_turns FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages voice turns"
  ON public.clara_voice_turns FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_clara_voice_sessions_updated_at
  BEFORE UPDATE ON public.clara_voice_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

UPDATE public.app_settings
SET value = '"cartesia"'::jsonb
WHERE key = 'clara_tts_provider';
