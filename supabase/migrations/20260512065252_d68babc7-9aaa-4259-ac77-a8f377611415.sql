
ALTER TABLE public.conference_rooms
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'tagungscenter',
  ADD COLUMN IF NOT EXISTS length_m NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS width_m NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS height_m NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS cap_theater INTEGER,
  ADD COLUMN IF NOT EXISTS cap_parlament INTEGER,
  ADD COLUMN IF NOT EXISTS cap_uform INTEGER,
  ADD COLUMN IF NOT EXISTS cap_block INTEGER,
  ADD COLUMN IF NOT EXISTS cap_bankett INTEGER;

INSERT INTO public.conference_rooms
  (name, subtitle, category, capacity, description, image_url, style, equipment, sort_order, length_m, width_m, height_m, area_sqm, cap_theater, cap_parlament, cap_uform, cap_block, cap_bankett)
VALUES
  ('Bonn / Berlin', 'Flaggschiff · kombiniert', 'tagungscenter', 120, 'Unser größter Tagungsraum – flexibel teilbar, mit Tageslicht, Verdunkelung und direktem Foyer-Zugang. Ideal für Konferenzen, Produktpräsentationen, Galadinner & Hybrid-Events.', '/heidehof/orig/hero-conference.jpg', 'modern', ARRAY['wlan','beamer','klima','flipchart','mikro'], 10, 16.5, 7.0, 2.7, 120, 120, 70, 45, 50, 80),
  ('Frankfurt', 'Quadratisches Format', 'tagungscenter', 70, 'Großzügiger Quadratraum mit drei Fensterfronten – perfekt für Workshops mit Gruppenarbeit, Kreativsessions und Schulungen mit Bewegung im Raum.', '/heidehof/orig/tagungsraum-1.jpg', 'modern', ARRAY['wlan','beamer','klima','flipchart'], 20, 9.0, 9.0, 2.7, 80, 70, 40, 30, 36, 50),
  ('Berlin', 'Tageslicht-Klassiker', 'tagungscenter', 60, 'Der Allrounder. Helles Tageslicht, ergonomische Bestuhlung, vollausgestattete Medientechnik – für Seminare, Vertriebs-Meetings und Strategie-Tage.', '/heidehof/orig/tagungsraum-2.jpg', 'modern', ARRAY['wlan','beamer','klima','flipchart'], 30, 9.5, 7.0, 2.7, 70, 60, 32, 28, 30, 40),
  ('Hamburg', 'Kompakt · fokussiert', 'tagungscenter', 40, 'Kompakter Raum für intensive Meetings, Boardroom-Sessions und kleine Workshops. Konzentriertes Arbeiten in eleganter Atmosphäre.', '/heidehof/orig/tagungsraum-3.jpg', 'modern', ARRAY['wlan','beamer','klima'], 40, 9.0, 5.5, 2.7, 50, 40, 22, 18, 20, 28),
  ('Bonn', 'Boutique-Tagung', 'tagungscenter', 40, 'Quadratischer Charaktersaal für Workshops, Coachings und Kreativ-Klausuren in privater Atmosphäre.', '/heidehof/orig/hotel-impression.jpg', 'modern', ARRAY['wlan','beamer','klima','flipchart'], 50, 7.0, 7.0, 2.7, 50, 40, 22, 22, 24, 30),
  ('Feuer', 'Element · warm', 'art-center', 30, 'Warmer Charakterraum im Art Center – ideal für inspirierende Workshops, Kamingespräche und kleine Gruppen.', '/heidehof/saal-heidehof.jpg', 'klassisch', ARRAY['wlan','flipchart','kaffee'], 60, 7.8, 5.5, 2.7, 42.9, 30, 18, 14, 16, 20),
  ('Wasser', 'Element · klar', 'art-center', 28, 'Klarer, lichtdurchfluteter Raum für Meditation, Coaching und ruhige Konzentration.', '/heidehof/salon-goethe.jpg', 'skandinavisch', ARRAY['wlan','flipchart','kaffee'], 70, 8.1, 4.4, 2.7, 35.6, 28, 16, 14, 14, 18),
  ('Holz', 'Element · natürlich', 'art-center', 25, 'Naturnaher Raum mit Holzelementen für nachhaltige Tagungen, Strategie-Klausuren und Team-Retreats.', '/heidehof/salon-hoelderlin.jpg', 'botanisch', ARRAY['wlan','flipchart','kaffee'], 80, 7.6, 4.2, 2.7, 31.9, 25, 14, 12, 12, 16)
ON CONFLICT DO NOTHING;
