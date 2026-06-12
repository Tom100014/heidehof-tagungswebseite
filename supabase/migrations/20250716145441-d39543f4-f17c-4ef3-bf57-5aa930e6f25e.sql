-- Create a configuration table for general service appointments
CREATE TABLE IF NOT EXISTS public.general_service_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name TEXT NOT NULL UNIQUE,
  form_description TEXT,
  sms_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  default_phone_number TEXT,
  default_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.general_service_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active configs"
  ON public.general_service_config
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all configs"
  ON public.general_service_config
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Insert the default configuration for General Service Appointments
INSERT INTO public.general_service_config (
  form_name,
  form_description,
  sms_enabled,
  whatsapp_enabled,
  email_enabled,
  default_phone_number,
  default_email,
  is_active
) VALUES (
  'General Service Appointments',
  'Book appointments for any hotel service',
  true,
  true,
  true,
  '017634177214',
  'sosotech2021@gmail.com',
  true
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_general_service_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_general_service_config_updated_at
  BEFORE UPDATE ON public.general_service_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_general_service_config_updated_at();