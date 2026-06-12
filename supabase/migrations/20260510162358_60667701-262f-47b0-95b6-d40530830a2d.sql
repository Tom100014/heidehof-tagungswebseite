
CREATE TABLE public.clara_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  inquiry_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone insert conversation"
  ON public.clara_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "anyone update own conversation by session"
  ON public.clara_conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "admins read conversations"
  ON public.clara_conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete conversations"
  ON public.clara_conversations FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_clara_conversations_updated
  BEFORE UPDATE ON public.clara_conversations
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

CREATE INDEX idx_clara_conversations_session ON public.clara_conversations(session_id);
CREATE INDEX idx_clara_conversations_created ON public.clara_conversations(created_at DESC);

CREATE TABLE public.clara_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  category text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone insert note"
  ON public.clara_notes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admins manage notes"
  ON public.clara_notes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_clara_notes_session ON public.clara_notes(session_id);
CREATE INDEX idx_clara_notes_created ON public.clara_notes(created_at DESC);
