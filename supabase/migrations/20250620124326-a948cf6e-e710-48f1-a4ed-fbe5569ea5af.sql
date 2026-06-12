
-- Create video_buttons table for dynamic button management
CREATE TABLE public.video_buttons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Video',
  video_key text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_buttons ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage video buttons
CREATE POLICY "Admins can manage video buttons"
  ON public.video_buttons
  FOR ALL
  USING (true);

-- Create policy for public read access (for frontend)
CREATE POLICY "Public can view active video buttons"
  ON public.video_buttons
  FOR SELECT
  USING (is_active = true);

-- Insert default buttons based on existing functionality
INSERT INTO public.video_buttons (name, icon_name, video_key, position, is_active) VALUES
  ('Restaurant', 'UtensilsCrossed', 'restaurant-video', 1, true),
  ('Bar', 'Martini', 'bar-video', 2, true),
  ('Wellness', 'Waves', 'spa-video', 3, true),
  ('Events', 'Star', 'events-video', 4, true),
  ('Pool', 'Sun', 'pool-video', 5, true),
  ('Entertainment', 'Music', 'entertainment-video', 6, true),
  ('Aktivitäten', 'Heart', 'activities-video', 7, true),
  ('Sport', 'Award', 'sports-video', 8, true),
  ('Parken', 'Car', 'parking-video', 9, true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_video_buttons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_buttons_updated_at
  BEFORE UPDATE ON public.video_buttons
  FOR EACH ROW
  EXECUTE FUNCTION update_video_buttons_updated_at();
