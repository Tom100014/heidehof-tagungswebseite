
-- Erweitere blog_images Tabelle für Manager-Integration
ALTER TABLE public.blog_images 
ADD COLUMN IF NOT EXISTS manager_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS image_category TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_blog_images_manager_generated ON public.blog_images(manager_generated, blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_images_category ON public.blog_images(image_category, blog_post_id);

-- Update blog_posts Tabelle für bessere Bildverwaltung
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS manager_images_count INTEGER DEFAULT 0;

-- Funktion zum Speichern von Manager-Bildern
CREATE OR REPLACE FUNCTION public.save_manager_image_to_post(
  p_blog_post_id UUID,
  p_image_url TEXT,
  p_image_category TEXT,
  p_title TEXT DEFAULT 'Manager Generated Image',
  p_alt_text TEXT DEFAULT 'Blog image from manager'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_image_id UUID;
BEGIN
  -- Insert new manager image
  INSERT INTO public.blog_images (
    blog_post_id,
    url,
    title,
    alt_text,
    type,
    image_category,
    manager_generated,
    is_active
  ) VALUES (
    p_blog_post_id,
    p_image_url,
    p_title,
    p_alt_text,
    'content',
    p_image_category,
    true,
    true
  ) RETURNING id INTO v_image_id;
  
  -- Update manager images count
  UPDATE public.blog_posts 
  SET manager_images_count = (
    SELECT COUNT(*) 
    FROM public.blog_images 
    WHERE blog_post_id = p_blog_post_id 
    AND manager_generated = true 
    AND is_active = true
  )
  WHERE id = p_blog_post_id;
  
  RETURN v_image_id;
END;
$$;

-- Funktion zum Abrufen von Manager-Bildern für einen Blog-Post
CREATE OR REPLACE FUNCTION public.get_manager_images_for_post(p_blog_post_id UUID)
RETURNS TABLE (
  id UUID,
  url TEXT,
  image_category TEXT,
  title TEXT,
  alt_text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id,
    bi.url,
    bi.image_category,
    bi.title,
    bi.alt_text
  FROM public.blog_images bi
  WHERE bi.blog_post_id = p_blog_post_id
    AND bi.manager_generated = true
    AND bi.is_active = true
  ORDER BY bi.created_at ASC;
END;
$$;
