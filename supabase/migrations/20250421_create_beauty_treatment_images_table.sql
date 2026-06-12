
CREATE TABLE IF NOT EXISTS public.beauty_treatment_images (
  treatment_id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.beauty_treatment_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.beauty_treatment_images
  FOR SELECT USING (true);

CREATE POLICY "Enable insert/update for authenticated users only" ON public.beauty_treatment_images
  FOR ALL USING (auth.role() = 'authenticated');
