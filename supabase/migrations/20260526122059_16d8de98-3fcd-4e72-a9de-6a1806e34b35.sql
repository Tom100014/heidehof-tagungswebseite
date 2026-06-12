
CREATE TABLE IF NOT EXISTS public.google_reviews_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text,
  place_query text DEFAULT 'Heidehof Hotel Ingolstadt',
  min_rating int NOT NULL DEFAULT 4,
  max_reviews int NOT NULL DEFAULT 8,
  is_enabled boolean NOT NULL DEFAULT true,
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_reviews_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings public read"
  ON public.google_reviews_settings FOR SELECT
  USING (true);

CREATE POLICY "settings admin write"
  ON public.google_reviews_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_grs_updated
  BEFORE UPDATE ON public.google_reviews_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.google_reviews_settings (place_query, singleton)
VALUES ('Heidehof Hotel Ingolstadt', true)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.google_reviews_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text NOT NULL UNIQUE,
  display_name text,
  rating numeric(2,1),
  user_ratings_total int,
  reviews jsonb NOT NULL DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_reviews_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cache public read"
  ON public.google_reviews_cache FOR SELECT
  USING (true);

CREATE POLICY "cache admin write"
  ON public.google_reviews_cache FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
