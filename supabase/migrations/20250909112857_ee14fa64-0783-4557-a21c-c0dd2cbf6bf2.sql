-- Create enhanced SEO tracking tables for automated blog generator
CREATE TABLE IF NOT EXISTS public.blog_seo_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  seo_score INTEGER NOT NULL DEFAULT 0,
  keyword_density NUMERIC(5,2) DEFAULT 0.0,
  meta_title_length INTEGER DEFAULT 0,
  meta_description_length INTEGER DEFAULT 0,
  h_tags_structure JSONB DEFAULT '[]'::jsonb,
  internal_links_count INTEGER DEFAULT 0,
  featured_snippet_optimized BOOLEAN DEFAULT false,
  schema_markup_present BOOLEAN DEFAULT false,
  target_keywords TEXT[],
  lsi_keywords TEXT[],
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for blog_seo_analytics
ALTER TABLE public.blog_seo_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage SEO analytics
CREATE POLICY "Admins can manage blog SEO analytics" 
ON public.blog_seo_analytics 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create policy for public read access to SEO analytics
CREATE POLICY "Public can view SEO analytics for published posts" 
ON public.blog_seo_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.blog_posts 
    WHERE id = blog_seo_analytics.blog_post_id 
    AND status = 'published'
  )
);

-- Create automated blog generation logs table
CREATE TABLE IF NOT EXISTS public.automated_blog_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES public.automated_blog_schedules(id),
  execution_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trigger_type TEXT NOT NULL DEFAULT 'cron',
  generated_post_id UUID REFERENCES public.blog_posts(id),
  topic_used TEXT,
  ai_provider TEXT,
  seo_score INTEGER,
  quality_score INTEGER,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for automated_blog_logs
ALTER TABLE public.automated_blog_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage automated blog logs
CREATE POLICY "Admins can manage automated blog logs" 
ON public.automated_blog_logs 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_blog_seo_analytics_updated_at
  BEFORE UPDATE ON public.blog_seo_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_seo_analytics_post_id ON public.blog_seo_analytics(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_seo_analytics_seo_score ON public.blog_seo_analytics(seo_score);
CREATE INDEX IF NOT EXISTS idx_automated_blog_logs_schedule_id ON public.automated_blog_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_automated_blog_logs_timestamp ON public.automated_blog_logs(execution_timestamp);

-- Add SEO quality threshold column to automated_blog_schedules
ALTER TABLE public.automated_blog_schedules 
ADD COLUMN IF NOT EXISTS seo_quality_threshold INTEGER DEFAULT 85;