
-- Enums
CREATE TYPE drinks_category AS ENUM ('aperitif','weisswein','rotwein','rose','bier','softdrink','kaffee','tee','spirituose','cocktail','wasser');
CREATE TYPE food_course AS ENUM ('vorspeise','suppe','salat','hauptgang_fleisch','hauptgang_fisch','hauptgang_vegi','beilage','dessert','kinder','snack');
CREATE TYPE event_type AS ENUM ('hochzeit','firmenfeier','weihnachtsfeier','silvester','brunch','gala','live_music','tagung','sonstiges');
CREATE TYPE event_booking_source AS ENUM ('web','clara','admin');
CREATE TYPE event_booking_status AS ENUM ('new','confirmed','cancelled','waitlist');

-- drinks_menu
CREATE TABLE public.drinks_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category drinks_category NOT NULL,
  title text NOT NULL,
  description text,
  producer text,
  region text,
  volume_label text,
  price_eur numeric(10,2),
  price_label text,
  image_url text,
  image_storage_path text,
  image_prompt text,
  tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  embedding extensions.vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.drinks_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active drinks" ON public.drinks_menu FOR SELECT USING (is_active=true);
CREATE POLICY "admins manage drinks" ON public.drinks_menu FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER drinks_menu_touch BEFORE UPDATE ON public.drinks_menu FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- food_menu
CREATE TABLE public.food_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  course food_course NOT NULL,
  title text NOT NULL,
  description text,
  allergens text[] NOT NULL DEFAULT '{}',
  is_vegan boolean NOT NULL DEFAULT false,
  is_vegetarian boolean NOT NULL DEFAULT false,
  is_glutenfree boolean NOT NULL DEFAULT false,
  price_eur numeric(10,2),
  price_label text,
  image_url text,
  image_storage_path text,
  image_prompt text,
  tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  embedding extensions.vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.food_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active food" ON public.food_menu FOR SELECT USING (is_active=true);
CREATE POLICY "admins manage food" ON public.food_menu FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER food_menu_touch BEFORE UPDATE ON public.food_menu FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description_md text,
  event_type event_type NOT NULL DEFAULT 'sonstiges',
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  price_label text,
  capacity int,
  booking_enabled boolean NOT NULL DEFAULT true,
  booking_email text,
  agent_bookable boolean NOT NULL DEFAULT false,
  hero_image_url text,
  image_storage_path text,
  image_prompt text,
  gallery_urls text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  embedding extensions.vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published events" ON public.events FOR SELECT USING (is_active=true AND is_published=true);
CREATE POLICY "admins manage events" ON public.events FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- event_bookings
CREATE TABLE public.event_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  email text,
  phone text,
  party_size int NOT NULL DEFAULT 1,
  notes text,
  source event_booking_source NOT NULL DEFAULT 'web',
  status event_booking_status NOT NULL DEFAULT 'new',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert booking" ON public.event_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read bookings" ON public.event_bookings FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins update bookings" ON public.event_bookings FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins delete bookings" ON public.event_bookings FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER event_bookings_touch BEFORE UPDATE ON public.event_bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- menu_category_prompts
CREATE TABLE public.menu_category_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('drinks','food','event')),
  category text NOT NULL,
  prompt text NOT NULL,
  style_hint text,
  negative_prompt text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, category)
);
ALTER TABLE public.menu_category_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read prompts" ON public.menu_category_prompts FOR SELECT USING (true);
CREATE POLICY "admins manage prompts" ON public.menu_category_prompts FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER menu_category_prompts_touch BEFORE UPDATE ON public.menu_category_prompts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-media','menu-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read menu-media" ON storage.objects FOR SELECT USING (bucket_id='menu-media');
CREATE POLICY "admins insert menu-media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='menu-media' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins update menu-media" ON storage.objects FOR UPDATE
  USING (bucket_id='menu-media' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins delete menu-media" ON storage.objects FOR DELETE
  USING (bucket_id='menu-media' AND has_role(auth.uid(),'admin'::app_role));

-- Sync to Clara trigger function (generic)
CREATE OR REPLACE FUNCTION public.sync_menu_to_clara()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text := TG_TABLE_NAME;
BEGIN
  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/sync-menu-to-clara',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('kind', v_kind, 'record_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;

CREATE TRIGGER drinks_menu_sync_clara AFTER INSERT OR UPDATE ON public.drinks_menu
  FOR EACH ROW EXECUTE FUNCTION public.sync_menu_to_clara();
CREATE TRIGGER food_menu_sync_clara AFTER INSERT OR UPDATE ON public.food_menu
  FOR EACH ROW EXECUTE FUNCTION public.sync_menu_to_clara();
CREATE TRIGGER events_sync_clara AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.sync_menu_to_clara();

-- Forward event bookings via email routing
CREATE OR REPLACE FUNCTION public.forward_event_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/forward-category-request',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('category_key','veranstaltung','source_table','event_bookings','record_id',NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;

CREATE TRIGGER event_bookings_forward AFTER INSERT ON public.event_bookings
  FOR EACH ROW EXECUTE FUNCTION public.forward_event_booking();

-- Match function for Clara
CREATE OR REPLACE FUNCTION public.match_menu(
  query_embedding extensions.vector,
  match_count int DEFAULT 5,
  filter_kind text DEFAULT NULL
)
RETURNS TABLE (
  kind text, id uuid, title text, description text, category text,
  image_url text, price_label text, similarity float
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  (SELECT 'drink'::text, d.id, d.title, d.description, d.category::text,
          d.image_url, d.price_label,
          1 - (d.embedding <=> query_embedding) AS similarity
   FROM public.drinks_menu d
   WHERE d.is_active AND d.embedding IS NOT NULL
     AND (filter_kind IS NULL OR filter_kind='drinks')
   ORDER BY d.embedding <=> query_embedding LIMIT match_count)
  UNION ALL
  (SELECT 'food'::text, f.id, f.title, f.description, f.course::text,
          f.image_url, f.price_label,
          1 - (f.embedding <=> query_embedding) AS similarity
   FROM public.food_menu f
   WHERE f.is_active AND f.embedding IS NOT NULL
     AND (filter_kind IS NULL OR filter_kind='food')
   ORDER BY f.embedding <=> query_embedding LIMIT match_count)
  UNION ALL
  (SELECT 'event'::text, e.id, e.title, COALESCE(e.subtitle,e.description_md), e.event_type::text,
          e.hero_image_url, e.price_label,
          1 - (e.embedding <=> query_embedding) AS similarity
   FROM public.events e
   WHERE e.is_active AND e.is_published AND e.embedding IS NOT NULL
     AND (filter_kind IS NULL OR filter_kind='events')
   ORDER BY e.embedding <=> query_embedding LIMIT match_count);
$$;

-- Category email route entries
INSERT INTO public.category_email_routes (category_key, label, enabled, emails) VALUES
  ('getraenke','Getränkekarte-Anfragen',true,'{}'),
  ('speise','Speisekarte-Anfragen',true,'{}'),
  ('veranstaltung','Veranstaltungs-Buchungen',true,'{}')
ON CONFLICT DO NOTHING;

-- Seed category master prompts
INSERT INTO public.menu_category_prompts (kind, category, prompt, style_hint) VALUES
  ('drinks','weisswein','Editorial photo of a chilled white wine glass on a dark walnut bar, soft warm rim light, condensation droplets, shallow depth of field, oriental spa hotel ambience','luxury hotel'),
  ('drinks','rotwein','Editorial photo of a Bordeaux glass of red wine on dark wood, candle bokeh background, deep ruby color, cinematic lighting','luxury hotel'),
  ('drinks','cocktail','Editorial photo of a craft cocktail in a coupe glass, garnish, smoky backlight, dark moody bar','craft bar'),
  ('drinks','bier','Editorial photo of a fresh draft beer in a Pilsner glass, golden hour light, foam crown','german beer garden'),
  ('drinks','kaffee','Editorial photo of a cappuccino with latte art in white porcelain on dark marble','specialty coffee'),
  ('drinks','tee','Editorial photo of oriental tea in a glass pot with rising steam, warm spices nearby','oriental spa'),
  ('drinks','spirituose','Editorial photo of an aged spirit in a tumbler with one large ice cube, amber color, dark backdrop','whisky lounge'),
  ('drinks','aperitif','Editorial photo of a sparkling aperitif with orange peel, golden hour terrace blur','italian aperitivo'),
  ('drinks','softdrink','Clean editorial photo of a non-alcoholic refreshment with ice and herbs in a highball glass','fresh & natural'),
  ('drinks','wasser','Editorial photo of a sparkling water glass with lemon on slate','minimal'),
  ('drinks','rose','Editorial photo of chilled rosé wine in a tulip glass, summer terrace bokeh','provence summer'),
  ('food','vorspeise','Top-down editorial food photo of an elegant starter plate on dark slate, micro herbs, warm soft light, fine dining','michelin style'),
  ('food','suppe','Editorial overhead photo of a refined soup in a deep bowl with garnish drizzle, dark linen','fine dining'),
  ('food','salat','Editorial overhead of a composed salad with edible flowers on white ceramic','fresh & artistic'),
  ('food','hauptgang_fleisch','Editorial close-up of a perfectly seared meat plate with jus and seasonal sides, fine dining plating','michelin style'),
  ('food','hauptgang_fisch','Editorial close-up of a pan-seared fish fillet with crispy skin, citrus emulsion, micro greens','fine dining'),
  ('food','hauptgang_vegi','Editorial overhead of a colourful vegetarian main with grains, roasted vegetables, herb oil','plant forward'),
  ('food','dessert','Editorial close-up of a refined dessert with chocolate quenelle and berry coulis on dark plate','patisserie'),
  ('food','kinder','Friendly editorial photo of a kids meal plated playfully but elegantly','family friendly'),
  ('food','snack','Editorial photo of a tapas-style snack board with charcuterie and dips','bar snack'),
  ('food','beilage','Editorial close-up of a refined side dish, perfectly portioned','fine dining'),
  ('event','hochzeit','Editorial wide shot of an elegant wedding reception hall, candlelight, tall floral centerpieces, warm golden ambience','luxury wedding'),
  ('event','firmenfeier','Editorial photo of a sophisticated corporate gala dinner in a hotel ballroom, soft uplighting','corporate elegance'),
  ('event','weihnachtsfeier','Editorial photo of a festive christmas dinner setup with greenery, candles and gold accents','cosy christmas'),
  ('event','silvester','Editorial photo of a glamorous new year''s eve gala, sparkling decor, champagne, midnight ambience','silvester gala'),
  ('event','brunch','Editorial overhead of a lavish sunday brunch table with pastries, fruit, coffee, natural light','sunday brunch'),
  ('event','gala','Editorial wide of a black-tie gala dinner with crystal glassware and uplit stage','black tie gala'),
  ('event','live_music','Editorial photo of an intimate live jazz performance in a luxury hotel lounge','jazz lounge'),
  ('event','tagung','Editorial photo of a premium conference setup with branded stage and ambient lighting','premium conference'),
  ('event','sonstiges','Editorial photo of an elegant event setup in a hotel venue','luxury hotel');
