
-- Füge cta_buttons Spalte zur blog_posts Tabelle hinzu
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS cta_buttons JSONB DEFAULT NULL;

-- Index für bessere Performance bei CTA-Abfragen
CREATE INDEX IF NOT EXISTS idx_blog_posts_cta_buttons 
ON public.blog_posts USING GIN (cta_buttons);
