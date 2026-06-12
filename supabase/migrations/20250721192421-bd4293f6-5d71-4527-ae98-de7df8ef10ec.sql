-- Drop and recreate hotel_settings table with correct structure
DROP TABLE IF EXISTS public.hotel_settings CASCADE;

-- Create hotel_settings table for admin configuration
CREATE TABLE public.hotel_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for hotel_settings
CREATE POLICY "Admins can manage hotel settings"
  ON public.hotel_settings
  FOR ALL
  USING (is_admin());

CREATE POLICY "Public can read hotel settings"
  ON public.hotel_settings
  FOR SELECT
  USING (true);

-- Insert default room and key number configurations
INSERT INTO public.hotel_settings (setting_key, setting_value, description) VALUES
  ('valid_room_numbers', 
   '{"ranges": [{"from": 101, "to": 120}, {"from": 201, "to": 220}, {"from": 301, "to": 315}], "individual": []}',
   'Valid room number configuration'),
  ('valid_key_numbers', 
   '{"ranges": [{"from": 600, "to": 650}, {"from": 651, "to": 682}], "individual": [665, 672, 680, 681, 682, 684]}',
   'Valid spa key number configuration')
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_hotel_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hotel_settings_updated_at
  BEFORE UPDATE ON public.hotel_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_hotel_settings_updated_at();