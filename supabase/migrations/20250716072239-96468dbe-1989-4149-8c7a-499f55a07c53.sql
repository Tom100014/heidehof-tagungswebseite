-- Create form configurations table for centralized form management
CREATE TABLE public.form_configurations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage form configurations"
ON public.form_configurations
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_form_configurations_updated_at
  BEFORE UPDATE ON public.form_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial form configurations based on existing forms
INSERT INTO public.form_configurations (id, name, category, description, fields) VALUES
('beauty-appointments', 'Beauty-Behandlungen', 'Beauty & Wellness', 'Terminbuchung für Beauty-Behandlungen', '{
  "sms_enabled": true,
  "target_number": "+49 171 4755559",
  "email_enabled": false,
  "target_email": "admin@heidehof.de",
  "emailjs_enabled": false
}'),
('bar-max-orders', 'Bar Mäx Bestellungen', 'Restaurant & Bar', 'Bestellungen für Bar Mäx', '{
  "sms_enabled": true,
  "target_number": "+49 176 34177214",
  "email_enabled": false,
  "target_email": "admin@heidehof.de",
  "emailjs_enabled": false
}'),
('restaurant-maxwell-orders', 'Bar Mäx Snacks', 'Restaurant & Bar', 'Restaurant Maxwell Bestellungen', '{
  "sms_enabled": true,
  "target_number": "+49 176 34177214",
  "email_enabled": false,
  "target_email": "admin@heidehof.de",
  "emailjs_enabled": false
}'),
('table-reservations', 'Tischreservierung Restaurant', 'Restaurant & Bar', 'Tischreservierungen für das Restaurant', '{
  "sms_enabled": true,
  "target_number": "+49 176 34177214",
  "email_enabled": false,
  "target_email": "admin@heidehof.de",
  "emailjs_enabled": false
}'),
('shop-orders', 'Shop-Bestellungen', 'Shop', 'Bestellungen für den Hotel Shop', '{
  "sms_enabled": true,
  "target_number": "+49 176 34177214",
  "email_enabled": false,
  "target_email": "admin@heidehof.de",
  "emailjs_enabled": false
}'),
('conference-service', 'Konferenz-Service', 'Konferenz', 'Konferenz und Tagungsanfragen', '{
  "sms_enabled": true,
  "target_number": "+49 171 4755559",
  "email_enabled": false,
  "target_email": "admin@heidehof.de",
  "emailjs_enabled": false
}'),
('complaints-contact', 'Beschwerden/Kontakt', 'Kundenservice', 'Beschwerden und Kontaktanfragen', '{
  "sms_enabled": true,
  "target_number": "+49 176 34177214",
  "email_enabled": false,
  "target_email": "admin@heidehof.de",
  "emailjs_enabled": false
}');