CREATE TABLE public.day_journey_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT 'MapPin',
  eyebrow text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  story_md text NOT NULL DEFAULT '',
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  media_url text,
  poster_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.day_journey_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active day_journey_steps"
  ON public.day_journey_steps FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins manage day_journey_steps"
  ON public.day_journey_steps FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_day_journey_steps_touch
  BEFORE UPDATE ON public.day_journey_steps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.day_journey_steps (slug, sort_order, icon, eyebrow, title, body, story_md, media_type, media_url) VALUES
('ankommen', 1, 'MapPin', 'IHR TAG BEI UNS · 01 · ANKOMMEN', 'Ankunft ohne Umwege.', '5 km vom Audi Forum, kostenfreie Parkplätze direkt am Haus, Ladestationen für E-Fahrzeuge. Empfang, Garderobe, Kaffee – Ihre Gäste sind in fünf Minuten arbeitsbereit.', 'Direkt von der A9 in zehn Minuten erreichbar. Großzügiger Empfangsbereich, freundliche Begrüßung, Welcome-Kaffee und ein kurzer Walk-through – Ihre Teilnehmer fühlen sich sofort zu Hause.', 'image', '/heidehof/orig/hotel-aussen.jpg'),
('tagen', 2, 'Monitor', 'IHR TAG BEI UNS · 02 · TAGEN', 'Konzentriert. Inspiriert.', '8 Tagungsräume mit Tageslicht, Hybrid-Technik und unbegrenztem WLAN. Vom 6-Personen-Boardroom bis zur 120-Personen-Plenum-Bühne.', 'Modernste Konferenztechnik, ergonomische Bestuhlung, dimmbares Licht und ganztägiges Kaffeebuffet halten Ihre Teams produktiv – ohne dass Sie einen Gedanken an die Logistik verschwenden müssen.', 'image', '/heidehof/orig/tagungsraum.jpg'),
('pause', 3, 'Coffee', 'IHR TAG BEI UNS · 03 · PAUSE', 'Pausen, die wirken.', 'Frische Smoothies, hausgemachtes Gebäck und Barista-Kaffee – auf der Sonnenterrasse oder am offenen Kamin.', 'Pausen sind keine Lücken im Plan, sondern Energiequellen. Unser Pausen-Konzept wechselt zwischen herzhaft, süß und vitaminreich – immer frisch, immer regional.', 'image', '/heidehof/orig/kaffeepause.jpg'),
('erholen', 4, 'Waves', 'IHR TAG BEI UNS · 04 · ERHOLEN', 'Abschalten im 400 m² Oriental Spa.', 'Pool, finnische Sauna, Dampfbad und Ruheoasen direkt im Haus – nach dem Workshop in den Bademantel.', 'Unser Spa-Bereich ist nach dem Tagungstag inklusive. Vom Pool aus über den Park blicken, in der Sauna loslassen, im Ruheraum die Augen schließen.', 'image', '/heidehof/orig/spa-pool.jpg'),
('geniessen', 5, 'Utensils', 'IHR TAG BEI UNS · 05 · GENIESSEN', 'Kulinarik mit Handschrift.', 'Vom Business-Lunch bis zum Sterneküchen-inspirierten Galadinner – unser Küchenchef komponiert für Sie.', 'Saisonal, regional, leidenschaftlich gekocht. Wein-Empfehlungen aus dem hauseigenen Keller, Service auf Augenhöhe und ein Abend, der noch lange nachklingt.', 'image', '/heidehof/orig/restaurant.jpg');