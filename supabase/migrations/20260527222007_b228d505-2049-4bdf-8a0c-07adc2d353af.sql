
-- Tagungspauschalen (editierbar im Admin, sichtbar auf /tagungspauschalen)
CREATE TABLE public.tagungs_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  number_label text NOT NULL DEFAULT '01',
  eyebrow text NOT NULL DEFAULT '',
  title text NOT NULL,
  price_value text NOT NULL DEFAULT '',
  price_suffix text NOT NULL DEFAULT '€ pro Person / Tag',
  price_note text NOT NULL DEFAULT '',
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  inclusions jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_url text,
  storage_path text,
  badge text,
  is_bestseller boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tagungs_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tagungs_packages TO authenticated;
GRANT ALL ON public.tagungs_packages TO service_role;
ALTER TABLE public.tagungs_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active packages" ON public.tagungs_packages FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage packages" ON public.tagungs_packages FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_tagungs_packages_touch BEFORE UPDATE ON public.tagungs_packages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Ausstattung & Technik Features (editierbar im Admin)
CREATE TABLE public.tech_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  number_label text NOT NULL DEFAULT '01',
  eyebrow text NOT NULL DEFAULT 'TECHNIK IN AKTION',
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  body_md text NOT NULL DEFAULT '',
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_url text,
  storage_path text,
  layout text NOT NULL DEFAULT 'image-left',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tech_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_features TO authenticated;
GRANT ALL ON public.tech_features TO service_role;
ALTER TABLE public.tech_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active tech" ON public.tech_features FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage tech" ON public.tech_features FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_tech_features_touch BEFORE UPDATE ON public.tech_features FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed Tagungspauschalen
INSERT INTO public.tagungs_packages (slug, number_label, eyebrow, title, price_value, price_suffix, price_note, highlights, inclusions, sort_order, is_bestseller)
VALUES
('tagungspauschale','01','KLASSISCH · TAGESVERANSTALTUNG','Tagungspauschale','75','€ pro Person / Tag','Buchbar ab 10 Personen · Tagungstechnik',
 '["Hightech TV für PC","Pinnwand & Flipchart","High-Speed WLAN"]'::jsonb,
 '["Geeigneter Tagungsraum entsprechend der Gruppengröße inkl. Technik","Ganztägiges Kaffeebuffet 08:00–18:00 Uhr (Kaffee, Tee, Joghurt, Obst, Gebäck, Tagessnacks)","Mittagessen als 3-Gang-Menü mit drei Hauptgängen zur Wahl + Salatbuffet","Mineralwasser unlimitiert im Seminarraum"]'::jsonb,
 1, false),
('tagungspauschale-premium','02','ALL-INCLUSIVE MIT ÜBERNACHTUNG & SPA','Tagungspauschale Premium','199','€ pro Person / Tag','Buchbar ab 10 Personen · 4★ Superior Tagungstechnik',
 '["Clever-Touch TV für PC","Pinnwand & Flipchart","High-Speed WLAN"]'::jsonb,
 '["Moderner Tagungsraum inkl. Vollausstattung","Ganztägiges Kaffeebuffet 08:00–18:00 Uhr","Mittagessen als 3-Gang-Menü, drei Hauptgerichte zur Wahl + Salatbuffet","Abendessen als 2-Gang-Menü, drei Hauptgerichte zur Wahl","Übernachtung im Classic-Einzelzimmer inkl. Frühstück","Heidehof-SPA: Pool, Sauna, Dampfbad, Fitness","Mineralwasser unbegrenzt im Seminarraum"]'::jsonb,
 2, true);

-- Seed Tech Features
INSERT INTO public.tech_features (slug, number_label, eyebrow, title, subtitle, body_md, bullets, layout, sort_order) VALUES
('clever-touch-tv','01','TECHNIK IN AKTION','Clever-Touch TV','Plug-and-play von jedem Notebook.','Interaktives 75″ Display mit Touch-Funktion für PC-Anschluss. Präsentieren, gemeinsam annotieren und in Echtzeit zusammenarbeiten – ohne Setup-Aufwand.','["Touch-Display 75 Zoll","Plug-and-play HDMI/USB-C","Drahtlose Bildübertragung","Whiteboard- & Annotation-Mode"]'::jsonb,'image-left',1),
('konferenz-audio','02','KRISTALLKLAR','Konferenz-Audio','Mikrofone, die jede Stimme tragen.','Festinstallierte Decken- und Tischmikrofone für hybride Meetings. Optional Bose-Lautsprecher für Keynotes bis 120 Personen.','["Decken- & Tischmikrofone","Bose-Beschallung","Hybrid-Meeting-fähig","Aufnahme auf Wunsch"]'::jsonb,'image-right',2),
('high-speed-wlan','03','VERBUNDEN','High-Speed WLAN','Glasfaser bis ins letzte Eck.','Symmetrische Glasfaser-Anbindung, eigenes Tagungs-WLAN mit Gast-Login. Stabil für Video-Konferenzen, Live-Streams und Cloud-Workloads.','["Symmetrisch 1 Gbit/s","Eigenes Tagungs-Netz","Sicherer Gast-Login","Stream-ready"]'::jsonb,'image-left',3),
('flipchart-pinnwand','04','ANALOG TRIFFT DIGITAL','Pinnwand & Flipchart','Werkzeuge, die jeder Workshop braucht.','Hochwertige Flipcharts, Pinnwände und Moderationskoffer in jedem Tagungsraum – auf Wunsch ergänzt durch digitale Boards.','["Premium-Flipchart","Moderationskoffer komplett","Pinnwände 1,50 m","Digital-Board optional"]'::jsonb,'image-right',4);
