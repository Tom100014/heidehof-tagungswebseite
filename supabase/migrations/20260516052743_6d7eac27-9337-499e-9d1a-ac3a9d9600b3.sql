
-- =========================================================
-- 1. INTEGRATIONS HUB
-- =========================================================
CREATE TABLE public.integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_secrets text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'not_configured',
  last_check_at timestamptz,
  last_error text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage integrations" ON public.integration_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_integration_settings_updated
  BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 2. CLARA WIDGET
-- =========================================================
CREATE TABLE public.clara_widget_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  allowed_origins text[] NOT NULL DEFAULT '{}',
  theme jsonb NOT NULL DEFAULT '{"primary":"#1A1A1A","position":"right"}'::jsonb,
  greeting text DEFAULT 'Hallo, ich bin Clara. Wie kann ich helfen?',
  voice_enabled boolean NOT NULL DEFAULT false,
  auto_open boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clara_widget_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage widgets" ON public.clara_widget_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "active widgets public read" ON public.clara_widget_configs
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE TRIGGER trg_widget_updated
  BEFORE UPDATE ON public.clara_widget_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 3. PAGE VISIBILITY
-- =========================================================
CREATE TABLE public.page_visibility (
  slug text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'page',
  is_visible boolean NOT NULL DEFAULT true,
  coming_soon boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.page_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read visibility" ON public.page_visibility
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage visibility" ON public.page_visibility
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_visibility_updated
  BEFORE UPDATE ON public.page_visibility
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.page_visibility (slug, label, category, sort_order) VALUES
  ('tagungspauschalen', 'Tagungspauschalen', 'page', 10),
  ('tagungsraeume', 'Tagungsräume', 'page', 20),
  ('speisekarte', 'Speisekarte', 'page', 30),
  ('getraenkekarte', 'Getränkekarte', 'page', 40),
  ('spa', 'Spa', 'page', 50),
  ('wellness', 'Wellness', 'page', 60),
  ('veranstaltungen', 'Veranstaltungen', 'page', 70),
  ('outdoor-aktiv', 'Outdoor & Aktiv', 'page', 80),
  ('ausstattung-technik', 'Ausstattung & Technik', 'page', 90),
  ('hero', 'Landing: Hero', 'section', 100),
  ('partner-logos', 'Landing: Partner-Logos', 'section', 110),
  ('impressionen', 'Landing: Impressionen', 'section', 120);

-- =========================================================
-- 4. EMAIL TEMPLATES
-- =========================================================
CREATE TABLE public.email_templates (
  key text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'transactional',
  subject text NOT NULL,
  preheader text,
  blocks jsonb NOT NULL DEFAULT '{}'::jsonb,
  variables text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_email_templates_updated
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.email_template_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL,
  subject text NOT NULL,
  preheader text,
  blocks jsonb NOT NULL,
  edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_template_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read history" ON public.email_template_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.email_templates (key, label, category, subject, preheader, blocks, variables) VALUES
  ('inquiry-confirmation', 'Anfrage-Bestätigung', 'auto-reply', 'Wir haben Ihre Anfrage erhalten', 'Vielen Dank für Ihre Anfrage', '{"intro":"Vielen Dank für Ihre Anfrage. Wir melden uns in Kürze.","cta_label":"","cta_url":"","footer":"Heidehof Hotel"}'::jsonb, ARRAY['guest_name','category']),
  ('tagung-inquiry', 'Tagung — Anfrage', 'inquiry', 'Neue Tagungs-Anfrage', '', '{"intro":"Eine neue Tagungs-Anfrage ist eingegangen.","cta_label":"Im Backend ansehen","cta_url":"https://hotel.../admin/inbox","footer":""}'::jsonb, ARRAY['guest_name','date','participants','room']),
  ('bar-order', 'Bar — Bestellung', 'inquiry', 'Neue Bar-Bestellung', '', '{"intro":"Eine neue Bar-Bestellung wartet.","cta_label":"","cta_url":"","footer":""}'::jsonb, ARRAY['guest_name','items']),
  ('wellness-booking', 'Wellness — Buchung', 'inquiry', 'Neue Wellness-Buchung', '', '{"intro":"Eine neue Wellness-Buchung ist eingegangen.","cta_label":"","cta_url":"","footer":""}'::jsonb, ARRAY['guest_name','treatment','date']),
  ('beauty-booking', 'Beauty — Buchung', 'inquiry', 'Neue Beauty-Buchung', '', '{"intro":"Eine neue Beauty-Buchung ist eingegangen.","cta_label":"","cta_url":"","footer":""}'::jsonb, ARRAY['guest_name','treatment','date']),
  ('restaurant-reservation', 'Restaurant — Reservierung', 'inquiry', 'Neue Tisch-Reservierung', '', '{"intro":"Eine neue Reservierung ist eingegangen.","cta_label":"","cta_url":"","footer":""}'::jsonb, ARRAY['guest_name','date','persons']),
  ('event-inquiry', 'Veranstaltung — Anfrage', 'inquiry', 'Neue Veranstaltungs-Anfrage', '', '{"intro":"Eine neue Veranstaltungs-Anfrage wartet.","cta_label":"","cta_url":"","footer":""}'::jsonb, ARRAY['guest_name','event','date']),
  ('contact', 'Kontakt — Allgemein', 'inquiry', 'Neue Kontakt-Anfrage', '', '{"intro":"Eine neue Kontakt-Anfrage ist eingegangen.","cta_label":"","cta_url":"","footer":""}'::jsonb, ARRAY['guest_name','message']),
  ('lead-outreach', 'Lead — Erstansprache (B2B)', 'outreach', 'Tagungsmöglichkeiten im Heidehof', 'Persönliche Tagungs-Empfehlung für {{company}}', '{"intro":"Sehr geehrte Damen und Herren von {{company}}, ich möchte Ihnen unsere Tagungsmöglichkeiten vorstellen.","cta_label":"Tagungsbereich ansehen","cta_url":"https://hotel.../tagungspauschalen","footer":"Bei Fragen stehen wir gerne zur Verfügung."}'::jsonb, ARRAY['company','contact_name','personalized_intro','unsubscribe_url']),
  ('lead-followup-1', 'Lead — Follow-up 1 (Tag 3)', 'outreach', 'Kurze Nachfrage zu unserem Tagungsangebot', '', '{"intro":"Vor wenigen Tagen habe ich Ihnen unser Tagungsangebot zugesendet. Darf ich nachfragen?","cta_label":"Tagungsräume ansehen","cta_url":"https://hotel.../tagungsraeume","footer":""}'::jsonb, ARRAY['company','contact_name','unsubscribe_url']),
  ('lead-followup-2', 'Lead — Follow-up 2 (Tag 7)', 'outreach', 'Letzte Erinnerung: Tagungs-Specials', '', '{"intro":"Falls aktuell kein Bedarf besteht, kein Problem — gerne komme ich später nochmal auf Sie zu.","cta_label":"","cta_url":"","footer":""}'::jsonb, ARRAY['company','contact_name','unsubscribe_url']);

-- =========================================================
-- 5. LEAD AGENT
-- =========================================================
CREATE TABLE public.lead_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mode text NOT NULL DEFAULT 'search',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_key text NOT NULL DEFAULT 'lead-outreach',
  daily_cap int NOT NULL DEFAULT 50,
  schedule jsonb NOT NULL DEFAULT '{"days":["mon","tue","wed","thu"],"hour":10}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  stats jsonb NOT NULL DEFAULT '{"sent":0,"opened":0,"clicked":0,"replied":0}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage campaigns" ON public.lead_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_campaigns_updated
  BEFORE UPDATE ON public.lead_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.lead_campaigns(id) ON DELETE CASCADE,
  company text NOT NULL,
  contact_name text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  postal_code text,
  industry text,
  source text,
  enrichment jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new',
  last_sent_at timestamptz,
  next_action_at timestamptz,
  sequence_step int NOT NULL DEFAULT 0,
  unsubscribed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_campaign ON public.leads(campaign_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_email ON public.leads(lower(email));
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.lead_campaigns(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_events_lead ON public.lead_events(lead_id);
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read lead events" ON public.lead_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "system inserts events" ON public.lead_events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.lead_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.lead_campaigns(id) ON DELETE CASCADE,
  step int NOT NULL,
  delay_days int NOT NULL DEFAULT 3,
  template_key text NOT NULL,
  UNIQUE (campaign_id, step)
);
ALTER TABLE public.lead_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage sequences" ON public.lead_sequences
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- Seed default integrations catalog
-- =========================================================
INSERT INTO public.integration_settings (key, label, category, description, required_secrets, sort_order) VALUES
  ('lovable_ai', 'Lovable AI Gateway', 'ai', 'Standard-KI für Texte, Vorschläge & Personalisierung. Kein eigener Key nötig.', '{}', 10),
  ('openai', 'OpenAI', 'ai', 'GPT-Modelle mit eigenem API-Key.', ARRAY['OPENAI_API_KEY'], 20),
  ('gemini', 'Google Gemini', 'ai', 'Gemini-Modelle direkt von Google.', ARRAY['GEMINI_API_KEY'], 30),
  ('elevenlabs', 'ElevenLabs (TTS)', 'voice', 'Sprachausgabe für Clara.', ARRAY['ELEVENLABS_API_KEY'], 40),
  ('cartesia', 'Cartesia (TTS)', 'voice', 'Alternative Sprachausgabe.', ARRAY['CARTESIA_API_KEY'], 50),
  ('resend', 'Resend (E-Mail)', 'email', 'Standard-Versand für Lovable Cloud.', ARRAY['RESEND_API_KEY'], 60),
  ('mailgun', 'Mailgun', 'email', 'Transaktionale E-Mails über Mailgun.', '{}', 70),
  ('twilio', 'Twilio (SMS)', 'messaging', 'SMS- und WhatsApp-Versand.', '{}', 80),
  ('hubspot', 'HubSpot', 'crm', 'CRM-Synchronisation für Leads.', '{}', 90),
  ('google_places', 'Google Places', 'leads', 'Firmen-Suche im Umkreis.', ARRAY['GOOGLE_PLACES_API_KEY'], 100),
  ('hunter_io', 'Hunter.io', 'leads', 'E-Mail-Verifikation und -Suche.', ARRAY['HUNTER_API_KEY'], 110),
  ('apollo', 'Apollo.io', 'leads', 'B2B-Datenbank für Lead-Suche.', ARRAY['APOLLO_API_KEY'], 120),
  ('firecrawl', 'Firecrawl', 'leads', 'Website-Scraping für Anreicherung.', '{}', 130),
  ('plausible', 'Plausible Analytics', 'analytics', 'Datenschutz-freundliches Analytics.', '{}', 140),
  ('ga4', 'Google Analytics 4', 'analytics', 'Tracking via gtag.', '{}', 150);

-- Default Lovable AI immer aktiv
UPDATE public.integration_settings SET is_enabled = true, status = 'connected' WHERE key = 'lovable_ai';
UPDATE public.integration_settings SET is_enabled = true, status = 'connected' WHERE key = 'resend';
