
-- Diagnose and fix blog images system
-- First, let's check and enhance the existing functions

-- Enhanced function to save manager images with better error handling
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
  v_blog_exists BOOLEAN;
BEGIN
  -- Check if blog post exists
  SELECT EXISTS(SELECT 1 FROM blog_posts WHERE id = p_blog_post_id) INTO v_blog_exists;
  
  IF NOT v_blog_exists THEN
    RAISE EXCEPTION 'Blog post with ID % does not exist', p_blog_post_id;
  END IF;
  
  -- Delete existing image with same category for this blog post (to avoid duplicates)
  DELETE FROM public.blog_images 
  WHERE blog_post_id = p_blog_post_id 
    AND image_category = p_image_category 
    AND manager_generated = true;
  
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
    CASE WHEN p_image_category = 'hero' THEN 'hero' ELSE 'content' END,
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

-- Enhanced function to get all images for a blog post (manager + template)
CREATE OR REPLACE FUNCTION public.get_all_blog_images(p_blog_post_id UUID)
RETURNS TABLE (
  id UUID,
  url TEXT,
  image_category TEXT,
  title TEXT,
  alt_text TEXT,
  source TEXT,
  is_manager_generated BOOLEAN
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
    bi.alt_text,
    CASE 
      WHEN bi.manager_generated = true THEN 'manager'
      ELSE 'template'
    END as source,
    bi.manager_generated as is_manager_generated
  FROM public.blog_images bi
  WHERE bi.blog_post_id = p_blog_post_id
    AND bi.is_active = true
  ORDER BY 
    bi.manager_generated DESC, -- Manager images first
    bi.created_at ASC;
END;
$$;

-- Function to sync template images to blog_images table
CREATE OR REPLACE FUNCTION public.sync_template_images_to_blog_images(p_blog_post_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blog_post blog_posts%ROWTYPE;
  v_template_images JSONB;
  v_key TEXT;
  v_url TEXT;
  v_synced_count INTEGER := 0;
BEGIN
  -- Get blog post with template images
  SELECT * INTO v_blog_post 
  FROM blog_posts 
  WHERE id = p_blog_post_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  v_template_images := COALESCE(v_blog_post.template_images, '{}'::jsonb);
  
  -- Loop through template images and sync to blog_images table
  FOR v_key, v_url IN SELECT * FROM jsonb_each_text(v_template_images)
  LOOP
    -- Insert or update template image in blog_images
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
      v_url::TEXT,
      v_blog_post.title || ' - ' || v_key,
      'Template image for ' || v_blog_post.title,
      CASE WHEN v_key = 'hero' THEN 'hero' ELSE 'content' END,
      v_key,
      false, -- Not manager generated
      true
    )
    ON CONFLICT (blog_post_id, image_category, manager_generated) 
    WHERE manager_generated = false
    DO UPDATE SET 
      url = EXCLUDED.url,
      title = EXCLUDED.title,
      alt_text = EXCLUDED.alt_text,
      updated_at = now();
    
    v_synced_count := v_synced_count + 1;
  END LOOP;
  
  RETURN v_synced_count;
END;
$$;

-- Add unique constraint to prevent duplicate images per category
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_images_unique_category 
ON public.blog_images (blog_post_id, image_category, manager_generated)
WHERE is_active = true;

-- Function to debug blog images for a specific post
CREATE OR REPLACE FUNCTION public.debug_blog_images(p_blog_post_id UUID)
RETURNS TABLE (
  debug_info JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_blog_post blog_posts%ROWTYPE;
  v_manager_images_count INTEGER;
  v_template_images_count INTEGER;
BEGIN
  -- Get blog post
  SELECT * INTO v_blog_post FROM blog_posts WHERE id = p_blog_post_id;
  
  IF NOT FOUND THEN
    v_result := jsonb_build_object('error', 'Blog post not found');
    RETURN QUERY SELECT v_result;
    RETURN;
  END IF;
  
  -- Count manager images
  SELECT COUNT(*) INTO v_manager_images_count
  FROM blog_images 
  WHERE blog_post_id = p_blog_post_id 
    AND manager_generated = true 
    AND is_active = true;
  
  -- Count template images in JSON
  SELECT jsonb_object_length(COALESCE(template_images, '{}'::jsonb)) INTO v_template_images_count
  FROM blog_posts 
  WHERE id = p_blog_post_id;
  
  -- Build debug info
  v_result := jsonb_build_object(
    'blog_post_id', p_blog_post_id,
    'blog_title', v_blog_post.title,
    'manager_images_count_db', v_manager_images_count,
    'manager_images_count_column', v_blog_post.manager_images_count,
    'template_images_count', v_template_images_count,
    'has_featured_image', v_blog_post.featured_image IS NOT NULL,
    'template_images_keys', (
      SELECT array_agg(key) 
      FROM jsonb_object_keys(COALESCE(v_blog_post.template_images, '{}'::jsonb)) key
    ),
    'manager_images_categories', (
      SELECT array_agg(image_category)
      FROM blog_images 
      WHERE blog_post_id = p_blog_post_id 
        AND manager_generated = true 
        AND is_active = true
    )
  );
  
  RETURN QUERY SELECT v_result;
END;
$$;
