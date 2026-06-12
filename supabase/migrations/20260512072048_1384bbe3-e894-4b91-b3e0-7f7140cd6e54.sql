-- Deactivate all rooms first, then upsert real ones by name (name has unique constraint)
UPDATE public.conference_rooms SET is_active = false;

INSERT INTO public.conference_rooms (name, subtitle, category, capacity, description, length_m, width_m, height_m, area_sqm, sort_order, is_active, equipment, style,
  cap_theater, cap_parlament, cap_uform, cap_block, cap_bankett)
VALUES
  ('Bonn / Berlin', 'Kombinierbar – größter Tagungsraum', 'tagungscenter', 0, 'Die Räume Berlin und Bonn lassen sich zum größten Tagungsraum Bonn/Berlin verbinden – ideal für größere Gruppen, Konferenzen und Bankette.', 16.5, 7, 2.7, 120, 1, true, '{}', 'modern', NULL, NULL, NULL, NULL, NULL),
  ('Frankfurt', NULL, 'tagungscenter', 0, 'Quadratischer Tagungsraum mit 80 m² – flexibel für Workshops, Seminare und mittelgroße Veranstaltungen.', 9, 9, 2.7, 80, 2, true, '{}', 'modern', NULL, NULL, NULL, NULL, NULL),
  ('Berlin', 'Einzeln oder mit Bonn kombinierbar', 'tagungscenter', 0, 'Heller Tagungsraum mit 70 m². Allein oder gemeinsam mit Bonn nutzbar.', 9.5, 7, 2.7, 70, 3, true, '{}', 'modern', NULL, NULL, NULL, NULL, NULL),
  ('Hamburg', NULL, 'tagungscenter', 0, 'Kompakter Tagungsraum mit 50 m² für Meetings und Schulungen.', 9, 5.5, 2.7, 50, 4, true, '{}', 'modern', NULL, NULL, NULL, NULL, NULL),
  ('Bonn', 'Einzeln oder mit Berlin kombinierbar', 'tagungscenter', 0, 'Quadratischer Raum mit 50 m². Allein oder gemeinsam mit Berlin nutzbar.', 7, 7, 2.7, 50, 5, true, '{}', 'modern', NULL, NULL, NULL, NULL, NULL),
  ('Feuer', 'Art Center', 'art-center', 0, 'Kreativraum im Art Center – 42 m² für Workshops und inspirierende Meetings.', 7.8, 5.5, 2.7, 42, 6, true, '{}', 'modern', NULL, NULL, NULL, NULL, NULL),
  ('Wasser', 'Art Center', 'art-center', 0, 'Kreativraum im Art Center – 38 m² für fokussierte Kleingruppen.', 8.1, 4.4, 2.7, 38, 7, true, '{}', 'modern', NULL, NULL, NULL, NULL, NULL),
  ('Holz', 'Art Center', 'art-center', 0, 'Kreativraum im Art Center – 35 m² für intime Workshops und Boardroom-Settings.', 7.6, 4.2, 2.7, 35, 8, true, '{}', 'modern', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (name) DO UPDATE SET
  subtitle = EXCLUDED.subtitle,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  length_m = EXCLUDED.length_m,
  width_m = EXCLUDED.width_m,
  height_m = EXCLUDED.height_m,
  area_sqm = EXCLUDED.area_sqm,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  cap_theater = NULL,
  cap_parlament = NULL,
  cap_uform = NULL,
  cap_block = NULL,
  cap_bankett = NULL;