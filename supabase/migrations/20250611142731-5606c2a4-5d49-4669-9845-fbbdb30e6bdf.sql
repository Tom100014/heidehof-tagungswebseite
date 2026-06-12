
-- Create table for storing template image configurations
CREATE TABLE public.template_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID,
  template_id TEXT NOT NULL,
  area_id TEXT NOT NULL,
  area_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  generated_images JSONB DEFAULT '[]'::jsonb,
  selected_image TEXT,
  aspect_ratio TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.template_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Authenticated users can manage template images" 
  ON public.template_images 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_template_images_updated_at
  BEFORE UPDATE ON public.template_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_template_images_template_id ON public.template_images(template_id);
CREATE INDEX idx_template_images_blog_post_id ON public.template_images(blog_post_id);
