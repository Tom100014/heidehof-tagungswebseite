CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guest_name TEXT,
  guest_contact TEXT,
  category TEXT,
  message TEXT NOT NULL,
  page_context TEXT,
  conversation_summary TEXT,
  ticket_required BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'neu',
  agent_used TEXT NOT NULL DEFAULT 'Maximilian'
);

GRANT SELECT, INSERT, UPDATE ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select" ON public.inquiries FOR SELECT USING (true);
CREATE POLICY "Public update" ON public.inquiries FOR UPDATE USING (true);

INSERT INTO public.app_settings (key, value)
VALUES ('maximilian_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value)
VALUES ('maximilian_agent_id', '"agent_3301kr5v8rezfkd9y3ey0x2w6xk7"'::jsonb)
ON CONFLICT (key) DO NOTHING;