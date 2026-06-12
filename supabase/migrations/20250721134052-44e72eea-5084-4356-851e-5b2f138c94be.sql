-- Insert Beauty-Behandlungen Konfiguration in form_configurations
INSERT INTO form_configurations (
  id,
  name, 
  category,
  description,
  fields,
  is_active
) VALUES (
  'beauty-appointments',
  'Beauty-Behandlungen',
  'services',
  'Konfiguration für Beauty- und Wellness-Behandlungstermine',
  '{
    "sms_enabled": true,
    "target_number": "+49 171 4755559",
    "email_enabled": true,
    "target_email": "beauty@der-heidehof.de",
    "emailjs_enabled": true
  }'::jsonb,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields,
  is_active = EXCLUDED.is_active,
  updated_at = now();