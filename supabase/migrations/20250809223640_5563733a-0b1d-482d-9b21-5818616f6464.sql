-- Message Templates System for Admin-editable WhatsApp/SMS texts
-- 1) Main table: message_templates
-- 2) Revisions table: message_template_revisions
-- 3) RLS policies: public read of active templates, admin full control
-- 4) Triggers and indexes

-- Create message_templates table
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,                 -- e.g. 'restaurant_maxwell.order', 'bar_max.order', 'table_reservation.confirmation'
  form_type TEXT NOT NULL,                    -- e.g. 'restaurant_maxwell', 'bar_max', 'conference', 'beauty', 'contact', 'shop', 'table_reservation'
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  language TEXT NOT NULL DEFAULT 'de',
  name TEXT NOT NULL,                         -- human readable name
  description TEXT,                           -- optional description/help
  content TEXT NOT NULL,                      -- the actual template body (with placeholders)
  variables JSONB NOT NULL DEFAULT '[]'::jsonb, -- optional schema/array of variables used
  is_active BOOLEAN NOT NULL DEFAULT true,    -- only one active per (template_key, channel, language)
  version INTEGER NOT NULL DEFAULT 1,         -- current version
  created_by UUID,                            -- admin user id (no FK to auth)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one active template per (template_key, channel, language)
CREATE UNIQUE INDEX IF NOT EXISTS uq_message_templates_active
  ON public.message_templates (template_key, channel, language)
  WHERE is_active = true;

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS idx_message_templates_lookup
  ON public.message_templates (form_type, template_key, channel, language);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_message_templates_updated_at ON public.message_templates;
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public can read active templates (needed for client-side rendering without auth)
DROP POLICY IF EXISTS "Anyone can view active message templates" ON public.message_templates;
CREATE POLICY "Anyone can view active message templates"
  ON public.message_templates
  FOR SELECT
  USING (is_active = true);

-- Admins can view all templates
DROP POLICY IF EXISTS "Admins can view all message templates" ON public.message_templates;
CREATE POLICY "Admins can view all message templates"
  ON public.message_templates
  FOR SELECT
  USING (is_admin());

-- Admins can insert/update/delete
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


-- Revisions table
CREATE TABLE IF NOT EXISTS public.message_template_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.message_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  change_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index to find revisions quickly
CREATE INDEX IF NOT EXISTS idx_message_template_revisions_key
  ON public.message_template_revisions (template_id, version DESC);

-- Enable RLS for revisions
ALTER TABLE public.message_template_revisions ENABLE ROW LEVEL SECURITY;

-- Admins full control on revisions
DROP POLICY IF EXISTS "Admins can manage message template revisions" ON public.message_template_revisions;
CREATE POLICY "Admins can manage message template revisions"
  ON public.message_template_revisions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Optional: Admins can select revisions
DROP POLICY IF EXISTS "Admins can view message template revisions" ON public.message_template_revisions;
CREATE POLICY "Admins can view message template revisions"
  ON public.message_template_revisions
  FOR SELECT
  USING (is_admin());

-- Note: No public read on revisions (only active template content is public via message_templates)

-- Seed minimal initial records (optional). Keeping empty to let admins create via UI.
-- INSERT statements can be added later in the admin UI.
