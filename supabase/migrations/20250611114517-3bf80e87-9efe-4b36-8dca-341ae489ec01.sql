
-- Add template-related columns to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS template_id TEXT,
ADD COLUMN IF NOT EXISTS structured_content JSONB,
ADD COLUMN IF NOT EXISTS template_images JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the new columns
COMMENT ON COLUMN public.blog_posts.template_id IS 'ID of the template used for this blog post';
COMMENT ON COLUMN public.blog_posts.structured_content IS 'Structured content data for template-based rendering';
COMMENT ON COLUMN public.blog_posts.template_images IS 'Generated images for template areas';
