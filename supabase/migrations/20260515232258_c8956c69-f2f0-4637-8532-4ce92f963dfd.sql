
-- Extension for embeddings (already enabled in project, safe-check)
CREATE EXTENSION IF NOT EXISTS vector;

-- ===================== ENUMS =====================
DO $$ BEGIN
  CREATE TYPE public.wellness_category AS ENUM (
    'beauty_men','beauty_women','depilation','massagen','hand_fuss','sonstiges',
    'sauna','pool','ruhebereich','spa_general','wellness_general'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wellness_page AS ENUM ('wellness','spa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===================== TABLES =====================
CREATE TABLE IF NOT EXISTS public.wellness_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category public.wellness_category NOT NULL DEFAULT 'sonstiges',
  target_page public.wellness_page NOT NULL DEFAULT 'spa',
  duration_minutes integer,
  duration_label text,
  price_eur numeric(8,2),
  price_label text,
  image_url text,
  image_storage_path text,
  image_prompt text,
  tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wellness_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page public.wellness_page NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  subtitle text,
  body_md text DEFAULT '',
  hero_image_url text,
  hero_storage_path text,
  master_image_prompt text,
  opening_hours text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page, slug)
);

CREATE TABLE IF NOT EXISTS public.wellness_category_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.wellness_category UNIQUE NOT NULL,
  prompt text NOT NULL DEFAULT '',
  style_hint text DEFAULT '',
  negative_prompt text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===================== INDEXES =====================
CREATE INDEX IF NOT EXISTS wellness_treatments_cat_idx ON public.wellness_treatments(category);
CREATE INDEX IF NOT EXISTS wellness_treatments_page_idx ON public.wellness_treatments(target_page);
CREATE INDEX IF NOT EXISTS wellness_treatments_emb_idx
  ON public.wellness_treatments USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS wellness_sections_page_idx ON public.wellness_sections(page);
CREATE INDEX IF NOT EXISTS wellness_sections_emb_idx
  ON public.wellness_sections USING hnsw (embedding vector_cosine_ops);

-- ===================== RLS =====================
ALTER TABLE public.wellness_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_category_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active treatments" ON public.wellness_treatments
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage treatments" ON public.wellness_treatments
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "public read active sections" ON public.wellness_sections
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage sections" ON public.wellness_sections
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "public read category prompts" ON public.wellness_category_prompts
  FOR SELECT USING (true);
CREATE POLICY "admins manage category prompts" ON public.wellness_category_prompts
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===================== updated_at TRIGGERS =====================
CREATE TRIGGER trg_wellness_treatments_updated
  BEFORE UPDATE ON public.wellness_treatments
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
CREATE TRIGGER trg_wellness_sections_updated
  BEFORE UPDATE ON public.wellness_sections
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
CREATE TRIGGER trg_wellness_category_prompts_updated
  BEFORE UPDATE ON public.wellness_category_prompts
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- ===================== STORAGE BUCKET =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('wellness-media','wellness-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read wellness-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'wellness-media');
CREATE POLICY "admins write wellness-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'wellness-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update wellness-media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'wellness-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete wellness-media" ON storage.objects
  FOR DELETE USING (bucket_id = 'wellness-media' AND public.has_role(auth.uid(),'admin'));

-- ===================== CLARA-SYNC TRIGGER =====================
CREATE OR REPLACE FUNCTION public.sync_wellness_to_clara()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text := TG_TABLE_NAME;
BEGIN
  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/sync-wellness-to-clara',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('kind', v_kind, 'record_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;

CREATE TRIGGER trg_wellness_treatments_sync
  AFTER INSERT OR UPDATE ON public.wellness_treatments
  FOR EACH ROW EXECUTE FUNCTION public.sync_wellness_to_clara();
CREATE TRIGGER trg_wellness_sections_sync
  AFTER INSERT OR UPDATE ON public.wellness_sections
  FOR EACH ROW EXECUTE FUNCTION public.sync_wellness_to_clara();

-- ===================== RAG MATCH FUNCTION =====================
CREATE OR REPLACE FUNCTION public.match_wellness(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_page text DEFAULT NULL
)
RETURNS TABLE (
  kind text,
  id uuid,
  title text,
  description text,
  category text,
  similarity float
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  (SELECT 'treatment'::text AS kind, t.id, t.title, t.description, t.category::text,
          1 - (t.embedding <=> query_embedding) AS similarity
   FROM public.wellness_treatments t
   WHERE t.is_active AND t.embedding IS NOT NULL
     AND (filter_page IS NULL OR t.target_page::text = filter_page)
   ORDER BY t.embedding <=> query_embedding
   LIMIT match_count)
  UNION ALL
  (SELECT 'section'::text, s.id, s.title, COALESCE(s.subtitle, s.body_md), 'section',
          1 - (s.embedding <=> query_embedding) AS similarity
   FROM public.wellness_sections s
   WHERE s.is_active AND s.embedding IS NOT NULL
     AND (filter_page IS NULL OR s.page::text = filter_page)
   ORDER BY s.embedding <=> query_embedding
   LIMIT match_count);
$$;

-- ===================== CATEGORY MASTER PROMPTS SEED =====================
INSERT INTO public.wellness_category_prompts (category, prompt, style_hint, negative_prompt) VALUES
('beauty_men',    'Professionelle Beauty-Fotografie für Männer im luxuriösen Spa-Ambiente. Warmes Licht, sauberes Beauty-Setup, hochwertige Pflegeprodukte sichtbar.', 'Editorial, warm tones, soft shadows', 'cartoon, low quality, watermark'),
('beauty_women',  'Elegante Beauty-Fotografie für Frauen, luxuriöses Spa-Ambiente, sanftes Licht, hochwertige Pflegeprodukte, ruhige Stimmung.', 'Editorial soft glow, premium spa', 'cartoon, low quality, watermark'),
('depilation',    'Klinisch saubere Beauty-Behandlung im hellen Studio, professionelle Hautpflege-Atmosphäre.', 'Bright clean, soft natural light', 'cartoon, low quality, watermark'),
('massagen',      'Hochwertige Massage-Szene in einem orientalisch inspirierten Spa, weiche Decken, warme Öle, sanftes Kerzenlicht.', 'Cinematic, intimate, warm light', 'cartoon, low quality, watermark'),
('hand_fuss',     'Maniküre/Pediküre Setup im luxuriösen Spa, gepflegte Hände, edle Werkzeuge, weiße Handtücher, dezentes Licht.', 'Clean luxury detail shot', 'cartoon, low quality, watermark'),
('sonstiges',     'Wellness-Stimmungsbild im Oriental Spa, ruhige Eleganz, sanftes Licht.', 'Premium spa mood', 'cartoon, low quality, watermark'),
('sauna',         'Finnische Sauna aus warmem Holz, sanftes Licht, Aufguss-Kelle, klare Linien, hochwertige Atmosphäre.', 'Cinematic warm wood, steam', 'cartoon, low quality, watermark'),
('pool',          'Eleganter Innen-/Außenpool eines 4-Sterne-Superior Hotels, türkisblaues Wasser, ruhige Spa-Atmosphäre.', 'Architectural, luxurious water reflections', 'cartoon, low quality, watermark'),
('ruhebereich',   'Asiatisch inspirierter Ruheraum im Spa, Liegen mit weichen Decken, warmes indirektes Licht, Pflanzen.', 'Zen, calm, warm light', 'cartoon, low quality, watermark'),
('spa_general',   'Luxuriöses Oriental Spa, Eingangsbereich mit warmem Holz, edlen Stoffen, indirekter Beleuchtung.', 'Editorial luxury', 'cartoon, low quality'),
('wellness_general','Hotel Wellness-Bereich Conference & Spa Resort, edel, ruhig, hochwertig.', 'Editorial luxury', 'cartoon, low quality')
ON CONFLICT (category) DO NOTHING;

-- ===================== INITIAL SECTIONS SEED =====================
INSERT INTO public.wellness_sections (page, slug, title, subtitle, body_md, opening_hours, sort_order) VALUES
('wellness','pool','Innen- & Außenpool','Entspannung im türkisblauen Wasser','Genießen Sie unseren beheizten Innenpool mit Grotte und den ganzjährig geöffneten Außenpool. Whirlpool mit 36°C und Kneippgang inklusive.','Täglich 07:00 – 22:00', 10),
('wellness','sauna','Sauna-Landschaft','Finnisch · Salz · Aroma · Tepidarium','Finnische Sauna 85-95°C, Himalaya-Salz-Sauna 60°C, Aroma-Dampfbad 45°C und Tepidarium 37-39°C. Ab 16 Jahren.','Täglich 07:00 – 22:00', 20),
('wellness','ruhebereich','Asiatischer Ruheraum','Stille zum Auftanken','Asiatisch inspirierter Ruheraum mit Erlebnisduschen und Solenebel-Inhalation. Teebar und Wasserstation kostenfrei.','Täglich 07:00 – 22:00', 30),
('spa','spa-uebersicht','Oriental Spa','Das Herzstück des Heidehof','Marken: Klapp Cosmetics & Ligne St. Barth. Tagesgäste 49 €, Reservierung empfohlen. Im August keine Behandlungen.','Mo–Do 10:00–22:00 · So 12:00–22:00', 10),
('spa','beauty-lounge','Beauty-Lounge','Gesicht · Körper · Detailpflege','Hyaluron, Vitamin-C, Fruchtsäure-Peeling, Wimpern- & Brauenpflege.','Termine nach Vereinbarung', 20),
('spa','massage-suite','Massage-Suite','Klassisch · Hot-Stone · Ayurveda','Klassische Rücken-Massage bis Karibische Kokosseifenschaum-Massage.','Termine nach Vereinbarung · keine Paarmassagen', 30)
ON CONFLICT (page, slug) DO NOTHING;

-- ===================== TREATMENTS SEED (30 entries) =====================
INSERT INTO public.wellness_treatments (slug, title, description, category, target_page, duration_minutes, duration_label, price_eur, price_label, sort_order, tags) VALUES
('bm-1','MEN DAY OFF','Aroma-Ölmassage, Gesichtsbehandlung A-Klapp, Nutzung des exklusiven SPA Bereichs','beauty_men','spa',120,'120 Min.',120.00,'120,00 €',10,'{men,day-off}'),
('bm-2','MEN FACE + BODY','Gesichtsbehandlung Klapp, Bürstenmassage mit Kokosschaum, Beauty Pack, Nutzung des exklusiven SPA Bereichs','beauty_men','spa',150,'150 Min.',145.00,'145,00 €',20,'{men,face,body}'),
('bm-3','KAVIAR MEN FACE','Reinigung, Enzympeeling, Tonic, Ausreinigen, Wirkstoffkonzentrat, Gesichtsmassage, Maske, Tagespflege','beauty_men','spa',60,'60 Min.',85.00,'85,00 €',30,'{men,kaviar,face}'),
('bm-4','ASA PEEL','Reinigung, Vorreinigung, Maske, Nachreinigung, Massage, Abschlusspflege','beauty_men','spa',60,'60 Min.',89.00,'89,00 €',40,'{men,peel}'),
('bm-5','STRI-PEXAN','Reinigung, Peeling, Tonic, Maske, Wirkstoffkonzentrat, Massage, Abschlusspflege','beauty_men','spa',75,'75 Min.',99.00,'99,00 €',50,'{men,anti-age}'),
('bm-6','C-PUR GESICHTSBEHANDLUNG','Reinigung, Peeling, Wirkstoffkonzentrat, Massage, Maske, Abschlusspflege','beauty_men','spa',75,'75 Min.',98.00,'98,00 €',60,'{men,vitamin-c}'),
('bw-1','HYALURONIK-SPEZIAL','Reinigung, Peeling, Tonic, Wirkstoffkonzentrat, Maske, Massage, Abschlusspflege','beauty_women','spa',75,'75 Min.',95.00,'95,00 €',70,'{women,hyaluron}'),
('bw-2','WIMPERN- UND BRAUENFÄRBEN','Professionelles Färben von Wimpern und Brauen','beauty_women','spa',20,'20 Min.',17.00,'17,00 €',80,'{women,augen}'),
('bw-3','WIMPERNFÄRBEN','Professionelles Färben der Wimpern','beauty_women','spa',15,'15 Min.',14.00,'14,00 €',90,'{women,wimpern}'),
('bw-4','BRAUENFÄRBEN','Professionelles Färben der Augenbrauen','beauty_women','spa',15,'15 Min.',9.00,'9,00 €',100,'{women,brauen}'),
('bw-5','AUGENBRAUENKORREKTUR','Professionelles Formen der Augenbrauen','beauty_women','spa',15,'15 Min.',9.00,'9,00 €',110,'{women,brauen}'),
('dp-1','Oberlippe','Professionelle Haarentfernung an der Oberlippe','depilation','spa',15,'15 Min.',15.00,'15,00 €',120,'{depilation}'),
('dp-2','Unterschenkel','Professionelle Haarentfernung an den Unterschenkeln','depilation','spa',30,'30 Min.',40.00,'40,00 €',130,'{depilation}'),
('dp-3','Beine komplett','Professionelle Haarentfernung an den kompletten Beinen','depilation','spa',45,'45 Min.',60.00,'60,00 €',140,'{depilation}'),
('ma-1','Gesichts- & Nackenmassage','Entspannende Massage für Gesicht und Nacken','massagen','spa',20,'20 Min.',39.00,'39,00 €',150,'{massage,gesicht}'),
('ma-2','Rückenmassage','Klassische Massage für den Rückenbereich','massagen','spa',20,'20 Min.',55.00,'55,00 €',160,'{massage,ruecken}'),
('ma-3','Hot Stone Massage','Tiefenwirksame Massage mit heißen Steinen','massagen','spa',40,'40 Min.',95.00,'95,00 €',170,'{massage,hot-stone}'),
('ma-4','Anti-Stress Massage','Entspannende Massage zur Stressreduktion','massagen','spa',30,'30 Min.',65.00,'65,00 €',180,'{massage,stress}'),
('ma-5','Bürstenmassage','Anregende Massage mit speziellen Bürsten','massagen','spa',25,'25 Min.',65.00,'65,00 €',190,'{massage,buerste}'),
('ma-6','Ätherische Öl-Massage','Wohltuende Massage mit duftenden ätherischen Ölen','massagen','spa',30,'30 Min.',70.00,'70,00 €',200,'{massage,oel}'),
('ma-7','Herbal Siam Kräuterstempelmassage','Traditionelle Massage mit Kräuterstempeln','massagen','spa',40,'40 Min.',85.00,'85,00 €',210,'{massage,siam}'),
('ma-8','Ayurvedische Ganzkörpermassage','Ganzheitliche ayurvedische Massage für Körper und Geist','massagen','spa',50,'50 Min.',83.00,'83,00 €',220,'{massage,ayurveda}'),
('ma-9','Karibische Kokosseifenschaummassage','Exotische Massage mit Kokosseifenschaum','massagen','spa',40,'40 Min.',85.00,'85,00 €',230,'{massage,karibik}'),
('hf-1','Pediküre','Professionelle Fußpflege','hand_fuss','spa',45,'45 Min.',45.00,'45,00 €',240,'{fuss}'),
('hf-2','Paraffinhandbad','Pflegendes Paraffinbad für die Hände','hand_fuss','spa',30,'30 Min.',35.00,'35,00 €',250,'{hand}'),
('hf-3','Hand SPA','Umfassende Handpflege und Entspannung','hand_fuss','spa',45,'45 Min.',55.00,'55,00 €',260,'{hand}'),
('hf-4','Maniküre mit Lack','Klassische Maniküre mit Farblack','hand_fuss','spa',50,'50 Min.',55.00,'55,00 €',270,'{hand,manikuere}'),
('hf-5','Foot SPA (inkl. Fußmassage)','Komplette Fußpflege mit entspannender Massage','hand_fuss','spa',50,'50 Min.',55.00,'55,00 €',280,'{fuss}'),
('so-1','Sunshower (Bräunung)','Schnelle und gleichmäßige Bräunung','sonstiges','spa',15,'15 Min.',15.00,'15,00 €',290,'{sonstiges,sunshower}')
ON CONFLICT (slug) DO NOTHING;

-- ===================== EMAIL ROUTING =====================
INSERT INTO public.category_email_routes (category_key, label, emails, enabled) VALUES
('wellness','Wellness Anfragen','{}', true),
('spa','Spa & Beauty Anfragen','{}', true)
ON CONFLICT DO NOTHING;
