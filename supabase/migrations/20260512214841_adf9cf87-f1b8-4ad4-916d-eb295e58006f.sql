
-- 1. Admin Audit Log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  entity text,
  entity_id text,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON public.admin_audit_log(entity, entity_id);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read audit log" ON public.admin_audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- log helper (security definer so client can call via rpc)
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text, p_entity text, p_entity_id text, p_diff jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT email INTO v_email FROM public.profiles WHERE user_id = auth.uid();
  INSERT INTO public.admin_audit_log(actor_user_id, actor_email, action, entity, entity_id, diff)
  VALUES (auth.uid(), v_email, p_action, p_entity, p_entity_id, COALESCE(p_diff, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- 2. Kitchen report runs
CREATE TABLE IF NOT EXISTS public.kitchen_report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  trigger_source text NOT NULL DEFAULT 'cron',
  service_date date,
  success boolean NOT NULL DEFAULT false,
  recipients jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_url text,
  orders_count integer DEFAULT 0,
  error text
);
CREATE INDEX IF NOT EXISTS idx_kitchen_runs_at ON public.kitchen_report_runs(run_at DESC);
ALTER TABLE public.kitchen_report_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read report runs" ON public.kitchen_report_runs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
-- inserts happen via service-role from edge function; no public insert policy

-- 3. Admin help texts
CREATE TABLE IF NOT EXISTS public.admin_help_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  section text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body_md text NOT NULL DEFAULT '',
  video_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_help_section ON public.admin_help_texts(section, sort_order);
ALTER TABLE public.admin_help_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active help texts" ON public.admin_help_texts
  FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage help texts" ON public.admin_help_texts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_admin_help_texts_touch
  BEFORE UPDATE ON public.admin_help_texts
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- 4. Onboarding state on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_state jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Allow user to update own onboarding_state already covered by "users update own profile"
-- Ensure profiles has an INSERT policy for own row (avoid blocking handle_new_user is fine since it's SECURITY DEFINER)

-- 5. Harden conference_order_items insert
CREATE OR REPLACE FUNCTION public.can_attach_order_item(_order_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conference_orders
    WHERE id = _order_id
      AND created_at > now() - interval '15 minutes'
  );
$$;

DROP POLICY IF EXISTS "anyone insert items" ON public.conference_order_items;
CREATE POLICY "anyone insert items for fresh order" ON public.conference_order_items
  FOR INSERT WITH CHECK (public.can_attach_order_item(order_id));

-- 6. Seed minimal help texts (safe upsert)
INSERT INTO public.admin_help_texts(key, section, title, body_md, sort_order) VALUES
  ('overview.intro', 'overview', 'Willkommen im Admin', 'Hier findest du alle Bereiche zur Steuerung des Hauses. Tipp: Nutze ⌘K für die Schnellsuche.', 0),
  ('inbox.intro', 'inbox', 'Anfragen-Posteingang', 'Neue Tagungsanfragen erscheinen hier in Echtzeit. Status setzen löst automatisch eine E-Mail an den Gast aus.', 0),
  ('rooms.intro', 'rooms', 'Tagungsräume verwalten', 'Pflege Räume, Bilder und Bestuhlungen. Änderungen sind sofort live auf der Webseite.', 0),
  ('kitchen.intro', 'kitchen', 'Küchenplan', 'Tägliche Bestellungen pro Raum. Um 10:30 Uhr geht automatisch ein PDF-Plan an die Küche.', 0),
  ('settings.intro', 'settings', 'Einstellungen', 'Hier konfigurierst du Empfänger für den Küchenreport, Marken-Texte und mehr.', 0)
ON CONFLICT (key) DO NOTHING;
