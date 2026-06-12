-- Add missing form configurations with specific target numbers and emails
-- Normalize phone number format to +49 format

-- Update existing beauty-appointments configuration to use normalized format
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(fields, '{target_number}', '"+49 176 34177214"'),
  '{target_email}', '"beauty@der-heidehof.de"'
)
WHERE id = 'beauty-appointments';

-- Add bar-max-orders configuration
INSERT INTO public.form_configurations (
  id,
  name, 
  category,
  description,
  fields,
  is_active
) VALUES (
  'bar-max-orders',
  'Bar Mäx Bestellungen',
  'orders',
  'Konfiguration für Bar Mäx Getränke- und Snackbestellungen',
  '{
    "sms_enabled": true,
    "target_number": "+49 176 34177214",
    "email_enabled": true,
    "target_email": "bar@der-heidehof.de",
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

-- Add restaurant-reservations configuration
INSERT INTO public.form_configurations (
  id,
  name, 
  category,
  description,
  fields,
  is_active
) VALUES (
  'restaurant-reservations',
  'Restaurant Reservierungen',
  'reservations',
  'Konfiguration für Restaurant-Tischreservierungen',
  '{
    "sms_enabled": true,
    "target_number": "+49 176 34177214",
    "email_enabled": true,
    "target_email": "restaurant@der-heidehof.de",
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

-- Add complaints-contact configuration
INSERT INTO public.form_configurations (
  id,
  name, 
  category,
  description,
  fields,
  is_active
) VALUES (
  'complaints-contact',
  'Beschwerden & Kontakt',
  'complaints',
  'Konfiguration für Beschwerden und allgemeine Kontaktanfragen',
  '{
    "sms_enabled": true,
    "target_number": "+49 176 34177214",
    "email_enabled": true,
    "target_email": "management@der-heidehof.de",
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

-- Add conference-service configuration
INSERT INTO public.form_configurations (
  id,
  name, 
  category,
  description,
  fields,
  is_active
) VALUES (
  'conference-service',
  'Konferenz Service',
  'services',
  'Konfiguration für Konferenz- und Event-Services',
  '{
    "sms_enabled": true,
    "target_number": "+49 176 34177214",
    "email_enabled": true,
    "target_email": "events@der-heidehof.de",
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

-- Add table-reservations configuration
INSERT INTO public.form_configurations (
  id,
  name, 
  category,
  description,
  fields,
  is_active
) VALUES (
  'table-reservations',
  'Tischreservierungen',
  'reservations',
  'Konfiguration für allgemeine Tischreservierungen',
  '{
    "sms_enabled": true,
    "target_number": "+49 176 34177214",
    "email_enabled": true,
    "target_email": "reservierung@der-heidehof.de",
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

-- Add shop-orders configuration
INSERT INTO public.form_configurations (
  id,
  name, 
  category,
  description,
  fields,
  is_active
) VALUES (
  'shop-orders',
  'Shop Bestellungen',
  'orders',
  'Konfiguration für Hotel-Shop Bestellungen',
  '{
    "sms_enabled": true,
    "target_number": "+49 176 34177214",
    "email_enabled": true,
    "target_email": "shop@der-heidehof.de",
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

-- Update general_service_config to use normalized phone format
UPDATE public.general_service_config 
SET default_phone_number = '+49 176 34177214',
    default_email = 'service@der-heidehof.de'
WHERE form_name = 'General Service Appointments';