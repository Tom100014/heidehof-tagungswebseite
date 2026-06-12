
CREATE TABLE IF NOT EXISTS public.elevenlabs_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context text NOT NULL UNIQUE,
  agent_name text NOT NULL,
  agent_id text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.elevenlabs_agents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.elevenlabs_agents TO authenticated;
GRANT ALL ON public.elevenlabs_agents TO service_role;

ALTER TABLE public.elevenlabs_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "elevenlabs_agents_read_all"
  ON public.elevenlabs_agents FOR SELECT
  USING (true);

CREATE POLICY "elevenlabs_agents_admin_insert"
  ON public.elevenlabs_agents FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "elevenlabs_agents_admin_update"
  ON public.elevenlabs_agents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "elevenlabs_agents_admin_delete"
  ON public.elevenlabs_agents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER elevenlabs_agents_touch_updated_at
  BEFORE UPDATE ON public.elevenlabs_agents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.elevenlabs_agents (context, agent_name, agent_id, is_active, sort_order) VALUES
  ('homepage',  'Maximilian – Heidehof Premium-Rezeptionist',     'agent_3301kr5v8rezfkd9y3ey0x2w6xk7', false, 10),
  ('tagung',    'Maximilian – Tagung & Events MICE',              'agent_9701ktq1qkcgepy8s149nk65e5az', false, 20),
  ('wellness',  'Maximilian – Wellness & Spa Heidehof-Oase',      'agent_3401ktq1gzd3f7h9x55tfj6ryyrq', false, 30),
  ('zimmer',    'Maximilian – Zimmerreservierung & Raten',        'agent_3101ktpcrs2tfjvbnmge26bqbenq', false, 40),
  ('restaurant','Maximilian – Service & FAQs Rezeption',          'agent_4801ktq1wjfeepvvbwjfy47akqje', false, 50)
ON CONFLICT (context) DO NOTHING;

INSERT INTO public.app_settings (key, value)
VALUES ('elevenlabs_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
