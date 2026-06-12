-- Adjust migration: avoid setting NOT NULL to prevent failure with existing NULL rows

-- Ensure base table exists
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Add columns if missing (leave nullable to be safe)
ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS template_key TEXT,
  ADD COLUMN IF NOT EXISTS form_type TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de',
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add CHECK constraint for channel if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'message_templates_channel_check'
  ) THEN
    ALTER TABLE public.message_templates
      ADD CONSTRAINT message_templates_channel_check CHECK (channel IN ('whatsapp', 'sms', 'email'));
  END IF;
END$$;

-- Indexes (safe to re-run)
CREATE UNIQUE INDEX IF NOT EXISTS uq_message_templates_active
  ON public.message_templates (template_key, channel, language)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_message_templates_lookup
  ON public.message_templates (form_type, template_key, channel, language);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_message_templates_updated_at ON public.message_templates;
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS and policies (idempotent)
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active message templates" ON public.message_templates;
CREATE POLICY "Anyone can view active message templates"
  ON public.message_templates
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all message templates" ON public.message_templates;
CREATE POLICY "Admins can view all message templates"
  ON public.message_templates
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert message templates" ON public.message_templates;
CREATE POLICY "Admins can insert message templates"
  ON public.message_templates
  FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update message templates" ON public.message_templates;
CREATE POLICY "Admins can update message templates"
  ON public.message_templates
  FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete message templates" ON public.message_templates;
CREATE POLICY "Admins can delete message templates"
  ON public.message_templates
  FOR DELETE
  USING (is_admin());

-- Revisions table (idempotent)
CREATE TABLE IF NOT EXISTS public.message_template_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.message_templates(id) ON DELETE CASCADE,
  version INTEGER,
  content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  change_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_template_revisions_key
  ON public.message_template_revisions (template_id, version DESC);

ALTER TABLE public.message_template_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage message template revisions" ON public.message_template_revisions;
CREATE POLICY "Admins can manage message template revisions"
  ON public.message_template_revisions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can view message template revisions" ON public.message_template_revisions;
CREATE POLICY "Admins can view message template revisions"
  ON public.message_template_revisions
  FOR SELECT
  USING (is_admin());