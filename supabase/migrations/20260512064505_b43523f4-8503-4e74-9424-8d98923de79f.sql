
-- Hotel reference image library (Heidehof)
CREATE TABLE public.hotel_reference_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NOT NULL,
  storage_path TEXT,
  source_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hotel_reference_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active reference images"
ON public.hotel_reference_images FOR SELECT
USING (is_active = true);

CREATE POLICY "admins manage reference images"
ON public.hotel_reference_images FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ref_images_updated
BEFORE UPDATE ON public.hotel_reference_images
FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

CREATE INDEX idx_ref_images_category ON public.hotel_reference_images(category);
CREATE INDEX idx_ref_images_tags ON public.hotel_reference_images USING GIN(tags);

-- Prompt layouts (Bilder + Prompt-Bausteine, klickbar speicherbar)
CREATE TABLE public.prompt_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  emoji TEXT,
  category TEXT NOT NULL DEFAULT 'menu',
  description TEXT,
  prompt_text TEXT NOT NULL DEFAULT '',
  reference_image_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active layouts"
ON public.prompt_layouts FOR SELECT
USING (is_active = true);

CREATE POLICY "admins manage layouts"
ON public.prompt_layouts FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_layouts_updated
BEFORE UPDATE ON public.prompt_layouts
FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- Builtin layout starter set
INSERT INTO public.prompt_layouts (slug, label, emoji, category, description, prompt_text, is_builtin, sort_order) VALUES
('tagungsmenue', 'Tagungsmenü', '📋', 'menu', 'Klassisches Tagungs-Mittagsmenü', 'Elegantes Tagungsmenü auf weißem Porzellan, helles Tageslicht, mittlere Portion, 45° Perspektive. Hintergrund wie auf den Referenzbildern des Heidehofs.', true, 10),
('speisekarte-restaurant', 'À-la-carte Speisekarte', '🍽️', 'menu', 'Restaurant-Hauptkarte', 'Hochwertiges Restaurant-Gericht im Stil des Heidehofs, dunkler eleganter Tisch, warmes Licht, Magazin-Qualität.', true, 20),
('barkarte', 'Barkarte / Drinks', '🍸', 'menu', 'Cocktails und Getränke an der Bar', 'Cocktail an der Heidehof-Bar, atmosphärische Beleuchtung, edle Gläser wie auf der Referenz, dunkler Hintergrund, Bokeh.', true, 30),
('fruehstuecksbuffet', 'Frühstücksbuffet', '🥐', 'menu', 'Frühstück / Brunch', 'Frisches Frühstücks-Arrangement, helles Morgenlicht, Buffet-Stil des Heidehofs.', true, 40),
('wellness-spa', 'Wellness & Spa', '🧖', 'wellness', 'Spa-/Wellness-Bereich', 'Stimmungsbild aus dem Heidehof Wellnessbereich, ruhige Atmosphäre, warmes indirektes Licht.', true, 50),
('tagungsraum-setup', 'Tagungsraum-Setup', '🏛️', 'rooms', 'Konferenzraum-Bestuhlung', 'Tagungsraum im Heidehof, professionelle Bestuhlung wie auf der Referenz, Tageslicht.', true, 60),
('flyer-angebot', 'Flyer / Angebot', '📰', 'marketing', 'Werbe-Flyer Hintergrundbild', 'Hero-Bild für ein Hotel-Angebot, viel Negativraum oben für Text, edle Komposition.', true, 70);
