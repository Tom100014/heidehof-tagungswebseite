CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.requests_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  category text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text NOT NULL DEFAULT '',
  embedding extensions.vector(1536),
  original_created_at timestamptz,
  archived_at timestamptz NOT NULL DEFAULT now(),
  read_by uuid
);

CREATE INDEX IF NOT EXISTS idx_requests_archive_source ON public.requests_archive(source_table, category);
CREATE INDEX IF NOT EXISTS idx_requests_archive_archived_at ON public.requests_archive(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_archive_payload_gin ON public.requests_archive USING GIN(payload);
CREATE INDEX IF NOT EXISTS idx_requests_archive_embedding ON public.requests_archive USING hnsw (embedding extensions.vector_cosine_ops);

ALTER TABLE public.requests_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read archive" ON public.requests_archive;
DROP POLICY IF EXISTS "admins insert archive" ON public.requests_archive;
DROP POLICY IF EXISTS "admins delete archive" ON public.requests_archive;
DROP POLICY IF EXISTS "service role full archive" ON public.requests_archive;

CREATE POLICY "admins read archive" ON public.requests_archive
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins insert archive" ON public.requests_archive
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete archive" ON public.requests_archive
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "service role full archive" ON public.requests_archive
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.match_archive(
  query_embedding extensions.vector,
  match_count int DEFAULT 5,
  filter_source text DEFAULT NULL,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_table text,
  category text,
  summary text,
  payload jsonb,
  original_created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  SELECT
    a.id, a.source_table, a.category, a.summary, a.payload, a.original_created_at,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM public.requests_archive a
  WHERE a.embedding IS NOT NULL
    AND (filter_source IS NULL OR a.source_table = filter_source)
    AND (filter_category IS NULL OR a.category = filter_category)
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
$$;