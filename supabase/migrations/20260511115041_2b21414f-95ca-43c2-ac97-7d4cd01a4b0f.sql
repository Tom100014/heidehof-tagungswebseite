-- 1. pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Tabelle clara_media
CREATE TABLE IF NOT EXISTS public.clara_media (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'general',
  tags         TEXT[] NOT NULL DEFAULT '{}',
  triggers     TEXT[] NOT NULL DEFAULT '{}',
  media_type   TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video','gallery')),
  url          TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT,
  caption      TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  embedding    extensions.vector(1536),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clara_media_category_idx ON public.clara_media (category);
CREATE INDEX IF NOT EXISTS clara_media_active_idx   ON public.clara_media (is_active);
CREATE INDEX IF NOT EXISTS clara_media_tags_idx     ON public.clara_media USING GIN (tags);
CREATE INDEX IF NOT EXISTS clara_media_triggers_idx ON public.clara_media USING GIN (triggers);
CREATE INDEX IF NOT EXISTS clara_media_embedding_idx
  ON public.clara_media USING hnsw (embedding extensions.vector_cosine_ops);

-- 3. Updated-At Trigger
CREATE TRIGGER trg_clara_media_touch
BEFORE UPDATE ON public.clara_media
FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- 4. RLS
ALTER TABLE public.clara_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active clara_media"
ON public.clara_media FOR SELECT
USING (is_active = true);

CREATE POLICY "admins manage clara_media"
ON public.clara_media FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Match-Funktion (semantische Suche)
CREATE OR REPLACE FUNCTION public.match_clara_media(
  query_embedding extensions.vector(1536),
  match_count INTEGER DEFAULT 5,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  triggers TEXT[],
  media_type TEXT,
  url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  SELECT
    m.id, m.title, m.description, m.category, m.tags, m.triggers,
    m.media_type, m.url, m.thumbnail_url, m.caption,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM public.clara_media m
  WHERE m.is_active = true
    AND m.embedding IS NOT NULL
    AND (filter_category IS NULL OR m.category = filter_category)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 6. Storage-Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('clara-media', 'clara-media', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage-Policies
CREATE POLICY "public read clara-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'clara-media');

CREATE POLICY "admins upload clara-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clara-media' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update clara-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clara-media' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete clara-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'clara-media' AND public.has_role(auth.uid(), 'admin'::public.app_role));