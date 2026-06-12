CREATE OR REPLACE FUNCTION public.tg_maximilian_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.elevenlabs_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text UNIQUE,
  agent_id text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  audio_url text,
  clara_context jsonb,
  summary text,
  extracted_fields jsonb,
  triggered_action_type text,
  triggered_action_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.elevenlabs_conversations TO authenticated;
GRANT ALL ON public.elevenlabs_conversations TO service_role;

ALTER TABLE public.elevenlabs_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all maximilian conversations"
  ON public.elevenlabs_conversations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage maximilian conversations"
  ON public.elevenlabs_conversations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access maximilian"
  ON public.elevenlabs_conversations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_maximilian_started_at ON public.elevenlabs_conversations (started_at DESC);
CREATE INDEX idx_maximilian_action ON public.elevenlabs_conversations (triggered_action_type, triggered_action_id);

CREATE TRIGGER update_maximilian_updated_at
  BEFORE UPDATE ON public.elevenlabs_conversations
  FOR EACH ROW EXECUTE FUNCTION public.tg_maximilian_set_updated_at();

INSERT INTO public.app_settings (key, value)
VALUES ('maximilian_agent_id', '"agent_3301kr5v8rezfkd9y3ey0x2w6xk7"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.app_settings (key, value)
VALUES ('maximilian_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;