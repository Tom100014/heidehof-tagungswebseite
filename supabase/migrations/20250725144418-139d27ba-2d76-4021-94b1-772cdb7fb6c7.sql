-- Fix RLS policies for blog_posts to allow proper deletion
DROP POLICY IF EXISTS "Service role can manage blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Verified admins can manage blog posts" ON public.blog_posts;

-- Recreate policies with proper permissions
CREATE POLICY "Service role can manage blog posts" ON public.blog_posts
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Verified admins can manage blog posts" ON public.blog_posts
FOR ALL USING (is_admin()) WITH CHECK (is_admin());