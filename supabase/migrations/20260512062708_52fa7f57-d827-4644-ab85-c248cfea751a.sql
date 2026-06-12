
CREATE TABLE IF NOT EXISTS public.image_style_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  emoji text,
  category text NOT NULL DEFAULT 'card-type',
  description text,
  layout_hint text,
  layout_instructions text NOT NULL DEFAULT '',
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  reference_images jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_builtin boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.image_style_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read image style templates"
  ON public.image_style_templates FOR SELECT USING (is_active = true);

CREATE POLICY "admins manage image style templates"
  ON public.image_style_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER image_style_templates_touch
  BEFORE UPDATE ON public.image_style_templates
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

INSERT INTO public.image_style_templates (slug, label, emoji, category, description, layout_hint, layout_instructions, style, is_builtin, sort_order) VALUES
('card-daily-menu','Tages-Speisekarte','🍽️','card-type','Klassische Tages-Speisekarte für Restaurant','daily-menu','Layout: Vorspeise oben, 3 Hauptgänge mittig (Fisch · Fleisch · Vegetarisch), Dessert unten. Eleganter Fine-Dining-Look.','{"quality":"professional","portion_size":"medium","perspective":"angle_45","lighting":"warm","extra_instructions":"Eleganter Restaurant-Look, weißes Porzellan, frische Kräuter-Garnitur, hochwertige Anrichtung."}'::jsonb,true,10),
('card-conference-menu','Tagungsmenü','💼','card-type','Business-Lunch / Tagung','conference-menu','Layout: 3-Gang Business-Menü, klare Spalten, Allergene rechts.','{"quality":"professional","portion_size":"medium","perspective":"angle_45","lighting":"natural","extra_instructions":"Business-Catering-Stil, klare Linien, helle Tischwäsche, dezente Garnitur."}'::jsonb,true,20),
('card-drinks','Getränkekarte','🍷','card-type','Wein, Bar, Cocktails','drinks-card','Layout: Kategorien (Wein, Bier, Cocktails, Alkoholfrei) als Spalten, dunkler Hintergrund.','{"quality":"editorial","portion_size":"small","perspective":"side","lighting":"dramatic","extra_instructions":"Bar-Atmosphäre, Glasreflexionen, dunkler Hintergrund, Cocktail-Fotografie-Stil."}'::jsonb,true,30),
('card-offer-flyer','Angebot / Flyer','🎟️','card-type','Marketing-Flyer mit Hero-Aufnahme','offer-flyer','Layout: Großes Hero-Bild oben, Headline, Preis-Block unten.','{"quality":"editorial","portion_size":"large","perspective":"angle_45","lighting":"dramatic","extra_instructions":"Werbe-Hero-Shot, viel Platz für Text-Overlay, knackige Farben."}'::jsonb,true,40),
('card-wellness','Wellness-Menü','🧘','card-type','Spa, Detox, leichte Küche','wellness-menu','Layout: Helle Bildsprache, viel Weißraum, kleine Portions-Bilder mit Detox-Hinweis.','{"quality":"editorial","portion_size":"small","perspective":"top_down","lighting":"natural","extra_instructions":"Helle ruhige Bildsprache, Stein-/Holzuntergrund, Bambus, frische Kräuter, sehr clean."}'::jsonb,true,50),
('card-bar','Bar-Karte','🍸','card-type','Cocktails & Spirituosen','bar-card','Layout: Cocktail-Karten 2-spaltig mit großen Glas-Fotos.','{"quality":"editorial","portion_size":"small","perspective":"side","lighting":"dramatic","extra_instructions":"Dunkler Bar-Counter, Bokeh-Lichter, Eiswürfel-Detail, Premium-Cocktail-Ästhetik."}'::jsonb,true,60),
('card-cosmetics','Kosmetik-Behandlungen','💆','card-type','Spa- & Kosmetik-Treatments','cosmetics-menu','Layout: Treatment-Liste mit Dauer & Preis, beruhigende Spa-Fotos.','{"quality":"editorial","portion_size":"small","perspective":"top_down","lighting":"natural","extra_instructions":"Spa-Ästhetik, weiche Tücher, Natursteine, Blütenblätter, Öle, warmes Naturholz."}'::jsonb,true,70),
('occ-mothers-day','Muttertag','🌷','occasion','Pastellfarben, Blüten, romantisch',null,'Saisonal: Pastellfarben, Tulpen-Deko, romantisches Setting.','{"quality":"editorial","portion_size":"medium","perspective":"angle_45","lighting":"natural","extra_instructions":"Pastellfarben, Tulpen / Pfingstrosen, helles Leinen, romantisch-feminin, viel Tageslicht."}'::jsonb,true,110),
('occ-valentine','Valentinstag','❤️','occasion','Rot, Kerzenlicht, Romantik',null,'Saisonal: Rosenblätter, Kerzenschein, dunkler Hintergrund.','{"quality":"editorial","portion_size":"tasting","perspective":"angle_45","lighting":"warm","extra_instructions":"Tiefrote Akzente, Rosenblätter, Kerzenschein, dunkler Hintergrund, intime Stimmung."}'::jsonb,true,120),
('occ-newyear','Silvester','🥂','occasion','Gold, Champagner, festlich',null,'Saisonal: Gold-Akzente, Champagner-Bokeh, festlich.','{"quality":"editorial","portion_size":"tasting","perspective":"angle_45","lighting":"dramatic","extra_instructions":"Gold-Akzente, Champagnerflöten, Bokeh-Lichter, festliche Glamour-Stimmung, schwarz-gold."}'::jsonb,true,130),
('occ-easter','Ostern','🐣','occasion','Frühling, Pastell, frisch',null,'Saisonal: Frühlingsblumen, Pastell-Eier-Deko.','{"quality":"professional","portion_size":"medium","perspective":"angle_45","lighting":"natural","extra_instructions":"Frühlingsblumen, Pastell-Eier-Deko, Birkenzweige, helle frische Frühlingsstimmung."}'::jsonb,true,140),
('occ-christmas','Weihnachten','🎄','occasion','Tannengrün, Gewürze, gemütlich',null,'Saisonal: Tannenzweige, Zimt, Sternanis, Kerzen, rot-grün.','{"quality":"editorial","portion_size":"large","perspective":"angle_45","lighting":"warm","extra_instructions":"Tannenzweige, Zimt, Sternanis, Kerzen, rot-grüne Akzente, gemütliches Winter-Restaurant."}'::jsonb,true,150),
('occ-summer-terrace','Sommer-Terrasse','☀️','occasion','Hell, leicht, mediterran',null,'Saisonal: Sonnige Terrasse, Olivenzweige, Zitronen, mediterran.','{"quality":"professional","portion_size":"medium","perspective":"angle_45","lighting":"natural","extra_instructions":"Sonnige Terrasse, Olivenzweige, Zitronen, helles Leinen, mediterrane Sommerstimmung."}'::jsonb,true,160)
ON CONFLICT (slug) DO NOTHING;
