-- Add missing columns to automated_blog_schedules table
ALTER TABLE automated_blog_schedules 
ADD COLUMN IF NOT EXISTS blogs_per_day integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS execution_times text[] DEFAULT ARRAY['08:00'],
ADD COLUMN IF NOT EXISTS topics_pool text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT 'perplexity',
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'premium-artikel',
ADD COLUMN IF NOT EXISTS tone text DEFAULT 'professionell',
ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 800,
ADD COLUMN IF NOT EXISTS enable_hero_images boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS image_style text DEFAULT 'professional';