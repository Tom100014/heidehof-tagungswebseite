
-- Erstelle Tabelle für permanente Bildspeicherung
CREATE TABLE public.saved_blog_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  alt_text TEXT,
  image_type TEXT NOT NULL CHECK (image_type IN ('hero', 'content', 'general')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords TEXT,
  file_size BIGINT,
  dimensions JSONB, -- {width: 1200, height: 800}
  upload_source TEXT DEFAULT 'manual', -- 'manual', 'generated', 'imported'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_saved_blog_images_type ON public.saved_blog_images(image_type);
CREATE INDEX IF NOT EXISTS idx_saved_blog_images_status ON public.saved_blog_images(status);
CREATE INDEX IF NOT EXISTS idx_saved_blog_images_tags ON public.saved_blog_images USING GIN(tags);

-- Trigger für updated_at
CREATE TRIGGER update_saved_blog_images_updated_at 
  BEFORE UPDATE ON public.saved_blog_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS für Sicherheit
ALTER TABLE public.saved_blog_images ENABLE ROW LEVEL SECURITY;

-- Policy für Admin-Zugriff
CREATE POLICY "Admins can manage saved blog images" 
  ON public.saved_blog_images FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Funktion zur Blog-Analyse
CREATE OR REPLACE FUNCTION public.analyze_blog_image_requirements(
  p_blog_post_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blog_post blog_posts%ROWTYPE;
  v_sections_count INTEGER := 0;
  v_total_word_count INTEGER := 0;
  v_hero_required INTEGER := 1;
  v_content_required INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Lade Blog-Post
  SELECT * INTO v_blog_post FROM blog_posts WHERE id = p_blog_post_id;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Blog post not found"}'::JSONB;
  END IF;
  
  -- Analysiere strukturierten Content
  IF v_blog_post.structured_content IS NOT NULL THEN
    -- Zähle Sections
    SELECT COALESCE(jsonb_array_length(v_blog_post.structured_content->'sections'), 0) INTO v_sections_count;
    
    -- Berechne Content-Bilder basierend auf Sections
    v_content_required := GREATEST(v_sections_count, 1);
    
    -- Extra Bilder für lange Artikel (mehr als 3 Sections)
    IF v_sections_count > 3 THEN
      v_content_required := v_sections_count;
    END IF;
    
  ELSE
    -- Fallback für Legacy-Content: analysiere Textlänge
    v_total_word_count := COALESCE(array_length(string_to_array(v_blog_post.content, ' '), 1), 0);
    
    -- 1 Content-Bild pro 300 Wörter, mindestens 1, maximal 4
    v_content_required := GREATEST(1, LEAST(4, v_total_word_count / 300));
  END IF;
  
  -- Erstelle Ergebnis
  v_result := jsonb_build_object(
    'blog_id', p_blog_post_id,
    'title', v_blog_post.title,
    'template_id', COALESCE(v_blog_post.template_id, 'default'),
    'has_structured_content', v_blog_post.structured_content IS NOT NULL,
    'sections_count', v_sections_count,
    'requirements', jsonb_build_object(
      'hero', v_hero_required,
      'content', v_content_required,
      'total', v_hero_required + v_content_required
    ),
    'current_images', jsonb_build_object(
      'hero', CASE WHEN v_blog_post.template_images ? 'hero' THEN 1 ELSE 0 END,
      'content', (
        SELECT COUNT(*) 
        FROM jsonb_object_keys(COALESCE(v_blog_post.template_images, '{}'::jsonb)) key 
        WHERE key LIKE 'content%'
      ),
      'total', jsonb_object_length(COALESCE(v_blog_post.template_images, '{}'::jsonb))
    )
  );
  
  RETURN v_result;
END;
$$;

-- Funktion zum Speichern eines Bildes in die permanente Bibliothek
CREATE OR REPLACE FUNCTION public.save_image_to_library(
  p_url TEXT,
  p_title TEXT,
  p_alt_text TEXT DEFAULT NULL,
  p_image_type TEXT DEFAULT 'general',
  p_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_keywords TEXT DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL,
  p_dimensions JSONB DEFAULT NULL,
  p_upload_source TEXT DEFAULT 'manual'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_image_id UUID;
BEGIN
  -- Prüfe ob Bild bereits existiert
  SELECT id INTO v_image_id 
  FROM saved_blog_images 
  WHERE url = p_url AND status = 'active';
  
  IF FOUND THEN
    -- Update usage count
    UPDATE saved_blog_images 
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = v_image_id;
    
    RETURN v_image_id;
  END IF;
  
  -- Speichere neues Bild
  INSERT INTO saved_blog_images (
    url, title, alt_text, image_type, tags, keywords,
    file_size, dimensions, upload_source
  ) VALUES (
    p_url, p_title, p_alt_text, p_image_type, p_tags, p_keywords,
    p_file_size, p_dimensions, p_upload_source
  ) RETURNING id INTO v_image_id;
  
  RETURN v_image_id;
END;
$$;
