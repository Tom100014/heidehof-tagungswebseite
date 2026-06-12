
-- restaurant_orders
CREATE TABLE public.restaurant_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_type text NOT NULL DEFAULT 'unknown',
  guest_name text,
  table_or_room text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'clara',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert restaurant_orders" ON public.restaurant_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read restaurant_orders" ON public.restaurant_orders FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update restaurant_orders" ON public.restaurant_orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins delete restaurant_orders" ON public.restaurant_orders FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- room_orders
CREATE TABLE public.room_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL,
  guest_name text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'clara',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.room_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert room_orders" ON public.room_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read room_orders" ON public.room_orders FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update room_orders" ON public.room_orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins delete room_orders" ON public.room_orders FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- complaints
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  urgency text NOT NULL DEFAULT 'normal',
  description text NOT NULL,
  guest_name text,
  contact text,
  guest_type text,
  room_or_table text,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'clara',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert complaints" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read complaints" ON public.complaints FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update complaints" ON public.complaints FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins delete complaints" ON public.complaints FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- clara_prompts
CREATE TABLE public.clara_prompts (
  key text PRIMARY KEY,
  label text NOT NULL,
  content text NOT NULL DEFAULT '',
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clara_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read clara_prompts" ON public.clara_prompts FOR SELECT USING (true);
CREATE POLICY "admins manage clara_prompts" ON public.clara_prompts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER touch_clara_prompts BEFORE UPDATE ON public.clara_prompts FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- clara_usage_log
CREATE TABLE public.clara_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool text NOT NULL,
  provider text,
  model text,
  units numeric NOT NULL DEFAULT 0,
  unit_kind text DEFAULT 'request',
  cost_estimate_eur numeric NOT NULL DEFAULT 0,
  session_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clara_usage_log_created_idx ON public.clara_usage_log(created_at DESC);
CREATE INDEX clara_usage_log_tool_idx ON public.clara_usage_log(tool, created_at DESC);
ALTER TABLE public.clara_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read clara_usage_log" ON public.clara_usage_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
-- inserts come via service role (edge functions) only

-- seed clara_prompts
INSERT INTO public.clara_prompts(key, label, content, description, sort_order) VALUES
('system_base', 'Concierge Persönlichkeit (System)',
'Du bist Clara, persönlicher Concierge im Hotel Der Heidehof in Gaimersheim/Ingolstadt. Sprich warm, persönlich, in der Sie-Form (Deutsch). Sehr kurze, natürliche Sätze (1–2 pro Antwort). Eine Frage pro Antwort. Keine Markdown-Aufzählungen – sprich wie ein Mensch am Telefon. Bei Erstkontakt fragst du freundlich nach: "Sind Sie heute Tagungsgast, Hotelgast, Tagesgast oder bei uns im Wellness-Bereich?" und merkst dir den Gast-Typ für den weiteren Verlauf. Du hilfst bei: Speisekarte zeigen, Bestellung aufnehmen (Restaurant, Bar, Zimmerservice), Wellness-Termine, Beschwerden, Tagungsanfragen.', 'Basis-Persönlichkeit, immer aktiv', 0),
('prompt_speisekarte', 'Speisekarte zeigen',
'Wenn der Gast nach Essen, Menü, Karte, Speisen oder Mittag/Abend fragt: rufe das Tool show_menu auf (meal_type lunch/dinner, optional date YYYY-MM-DD). Zeige proaktiv das heutige Menü. Beschreibe in 1-2 Sätzen die Highlights und frage, ob der Gast bestellen möchte.', 'Trigger für show_menu', 1),
('prompt_bestellung', 'Bestellung aufnehmen',
'Wenn der Gast bestellen möchte: kläre 1) Was genau (Gerichte, Getränke, Mengen)? 2) Gast-Typ falls noch unbekannt 3) Wo? Tagungsraum-Name, Tischnummer im Restaurant oder Zimmernummer 4) Sonderwünsche/Allergien. Dann nutze take_restaurant_order (Restaurant/Bar) ODER take_room_order (Zimmerservice). Bestätige am Ende präzise: "Ich habe für Sie notiert: …. Wird in ca. 15-20 Minuten serviert."', 'Restaurant-, Bar- und Zimmerbestellungen', 2),
('prompt_wellness', 'Wellness-Termin',
'Wenn der Gast Wellness, Spa, Massage, Beauty oder Behandlung erwähnt: kläre Behandlung, Wunschtermin (Datum + Uhrzeit), Name, Zimmer/Kontakt. Nutze request_wellness_appointment. Bestätige: "Ich gebe Ihren Wunsch ans Spa-Team weiter, Sie erhalten innerhalb 30 Minuten eine Bestätigung."', 'Spa/Beauty-Termine', 3),
('prompt_beschwerde', 'Beschwerde aufnehmen',
'Wenn der Gast unzufrieden ist, sich beschwert oder ein Problem meldet: zeige aufrichtiges Verständnis, frage nach Kategorie (Zimmer, Service, Essen, Sauberkeit, sonstiges), Dringlichkeit (sofort/heute/normal) und Beschreibung. Nutze submit_complaint. Sage zu: "Vielen Dank, dass Sie uns das mitteilen. Unser Manager wird sich umgehend persönlich um Sie kümmern."', 'Beschwerden-Routing', 4),
('prompt_tagungsanfrage', 'Tagungsanfrage',
'Wenn es um Tagungen, Konferenzen, Seminare, Workshops, Klausuren oder Firmenveranstaltungen geht: nutze die bestehenden Tools recommend_room, show_room, save_lead, send_inquiry. Sammle: Anlass, Personen, Datum, Bestuhlung, Übernachtung, Verpflegung, Technik, Kontakt. Schicke send_inquiry erst nach ausdrücklicher Bestätigung des Gastes.', 'Tagungs-Vertriebsflow', 5);

-- new app_settings keys (defaults)
INSERT INTO public.app_settings(key, value) VALUES
('clara_chat_model', '"google/gemini-3-flash-preview"'::jsonb),
('clara_stt_provider', '"cartesia"'::jsonb),
('clara_elevenlabs_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
