
-- 1) SETTINGS (single-row config)
CREATE TABLE public.mews_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL DEFAULT 'demo' CHECK (environment IN ('demo','live')),
  platform_address text NOT NULL DEFAULT 'https://api.mews-demo.com',
  client_name text NOT NULL DEFAULT 'Heidehof Website 1.0.0',
  is_enabled boolean NOT NULL DEFAULT false,
  auto_send_inquiries boolean NOT NULL DEFAULT false,
  auto_send_conference_orders boolean NOT NULL DEFAULT false,
  auto_send_restaurant_orders boolean NOT NULL DEFAULT false,
  default_outlet_id text,
  default_account_id text,
  send_window_start time DEFAULT '06:00',
  send_window_end time DEFAULT '23:59',
  last_test_at timestamptz,
  last_test_status text,
  last_test_error text,
  hotel_name text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mews_settings TO authenticated;
GRANT ALL ON public.mews_settings TO service_role;
ALTER TABLE public.mews_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage mews_settings" ON public.mews_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
CREATE TRIGGER mews_settings_touch BEFORE UPDATE ON public.mews_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) MAPPINGS
CREATE TABLE public.mews_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('outlet','product','room','rate','accounting_category','service')),
  local_id text NOT NULL,
  local_label text,
  mews_id text NOT NULL,
  mews_label text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, local_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mews_mappings TO authenticated;
GRANT ALL ON public.mews_mappings TO service_role;
ALTER TABLE public.mews_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage mews_mappings" ON public.mews_mappings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
CREATE TRIGGER mews_mappings_touch BEFORE UPDATE ON public.mews_mappings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) FIELD PERMISSIONS (DSGVO toggles)
CREATE TABLE public.mews_field_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'guest',
  allowed boolean NOT NULL DEFAULT true,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mews_field_permissions TO authenticated;
GRANT ALL ON public.mews_field_permissions TO service_role;
ALTER TABLE public.mews_field_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage mews_field_permissions" ON public.mews_field_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
CREATE TRIGGER mews_field_perms_touch BEFORE UPDATE ON public.mews_field_permissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) SYNC LOG
CREATE TABLE public.mews_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('outbound','inbound')),
  action text NOT NULL,
  source_table text,
  source_id text,
  status text NOT NULL CHECK (status IN ('ok','error','skipped','pending')),
  http_status int,
  request jsonb,
  response jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mews_sync_log_created_at_idx ON public.mews_sync_log (created_at DESC);
CREATE INDEX mews_sync_log_status_idx ON public.mews_sync_log (status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mews_sync_log TO authenticated;
GRANT ALL ON public.mews_sync_log TO service_role;
ALTER TABLE public.mews_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read mews_sync_log" ON public.mews_sync_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
CREATE POLICY "admins delete mews_sync_log" ON public.mews_sync_log
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 5) SEED defaults
INSERT INTO public.mews_settings (environment) VALUES ('demo')
ON CONFLICT DO NOTHING;

INSERT INTO public.mews_field_permissions (field_key, label, category, allowed, description, sort_order) VALUES
  ('guest_first_name',  'Vorname',           'guest',  true,  'Vorname des Gastes',                              10),
  ('guest_last_name',   'Nachname',          'guest',  true,  'Nachname des Gastes (Pflicht für Mews)',          20),
  ('guest_email',       'E-Mail',            'guest',  true,  'E-Mail-Adresse',                                  30),
  ('guest_phone',       'Telefon',           'guest',  false, 'Telefonnummer (optional)',                        40),
  ('company_name',      'Firma',             'guest',  true,  'Firma / Organisation',                            50),
  ('room_number',       'Zimmer-Nr.',        'order',  true,  'Zimmer-/Raumzuordnung für Buchung',               60),
  ('order_items',       'Bestellpositionen', 'order',  true,  'Einzelne Speisen / Getränke',                     70),
  ('prices',            'Preise',            'order',  true,  'Bruttopreise pro Position',                       80),
  ('allergens',         'Allergene',         'order',  false, 'Allergie-Informationen mitschicken',              90),
  ('special_requests',  'Sonderwünsche',     'order',  true,  'Freitext-Wünsche / Anmerkungen',                 100),
  ('inquiry_summary',   'Anfrage-Zusammenfassung','tagung', true, 'KI-Zusammenfassung der Tagungsanfrage',     110),
  ('inquiry_attendees', 'Personenzahl',      'tagung', true,  'Anzahl Teilnehmer',                              120),
  ('inquiry_dates',     'Tagungsdaten',      'tagung', true,  'Datum, Dauer, Übernachtung',                     130)
ON CONFLICT (field_key) DO NOTHING;
