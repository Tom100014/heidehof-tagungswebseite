
-- Create blog_images table for storing blog post images
CREATE TABLE public.blog_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hero', 'content', 'gallery')),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blog_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (since this is admin functionality)
CREATE POLICY "Allow all operations on blog_images" 
  ON public.blog_images 
  FOR ALL 
  USING (true);

-- Create index for better performance
CREATE INDEX idx_blog_images_blog_post_id ON public.blog_images(blog_post_id);
CREATE INDEX idx_blog_images_type ON public.blog_images(type);

-- Add trigger for updated_at
CREATE TRIGGER update_blog_images_updated_at
  BEFORE UPDATE ON public.blog_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
