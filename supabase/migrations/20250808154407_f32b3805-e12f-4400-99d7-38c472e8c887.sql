-- Fehlende Formular-Konfigurationen hinzufügen
INSERT INTO form_configurations (id, name, category, description, fields, is_active) VALUES
(
  'beauty-appointments',
  'Beauty-Termine',
  'beauty',
  'Beauty-Terminbuchungen und Wellness-Anfragen',
  '{
    "sms_enabled": true,
    "target_number": "+49 176 34177214",
    "email_enabled": true,
    "target_email": "wachendorf23@gmail.com",
    "emailjs_enabled": true
  }'::jsonb,
  true
),
(
  'conference-service',
  'Konferenz Service',
  'events',
  'Konferenz- und Event-Service Bestellungen',
  '{
    "sms_enabled": true,
    "target_number": "+49 176 34177214",
    "email_enabled": true,
    "target_email": "wachendorf23@gmail.com",
    "emailjs_enabled": true
  }'::jsonb,
  true
),
(
  'restaurant-maxwell-orders',
  'Restaurant Maxwell Bestellungen',
  'orders',
  'Restaurant Maxwell Essensbestellungen',
  '{
    "sms_enabled": true,
    "target_number": "+49 176 34177214",
    "email_enabled": true,
    "target_email": "wachendorf23@gmail.com",
    "emailjs_enabled": true
  }'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  fields = jsonb_set(
    jsonb_set(
      COALESCE(EXCLUDED.fields, '{}'::jsonb),
      '{target_number}', 
      '"+49 176 34177214"'::jsonb
    ),
    '{sms_enabled}',
    'true'::jsonb
  ),
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;