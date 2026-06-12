
-- Create a table for storing bar max item images
CREATE TABLE IF NOT EXISTS public.bar_max_item_images (
  id BIGSERIAL PRIMARY KEY,
  item_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id)
);

-- Set up RLS policies
ALTER TABLE public.bar_max_item_images ENABLE ROW LEVEL SECURITY;

-- Allow anyone to select from the table
CREATE POLICY "Allow public read access to bar max item images" 
  ON public.bar_max_item_images
  FOR SELECT 
  TO public 
  USING (true);

-- Allow authenticated users to insert and update
CREATE POLICY "Allow authenticated insert to bar max item images"
  ON public.bar_max_item_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to bar max item images"
  ON public.bar_max_item_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete from bar max item images"
  ON public.bar_max_item_images
  FOR DELETE
  TO authenticated
  USING (true);
