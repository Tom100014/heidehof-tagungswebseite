-- Update der korrekten Kontaktdaten für alle Services

-- Update allgemeine Service-Konfiguration auf die richtigen Daten
UPDATE public.general_service_config 
SET 
  default_phone_number = '+49 176 34177200',
  default_email = 'service@der-heidehof.de',
  updated_at = now()
WHERE is_active = true;

-- Update Beauty-Behandlungen auf die richtigen Daten
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(fields, '{target_number}', '"+49 176 34177214"'),
  '{target_email}', '"beauty@der-heidehof.de"'
)
WHERE id = 'beauty-appointments';

-- Update alle anderen Formulare auf die allgemeine Service-Konfiguration
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(fields, '{target_number}', '"+49 176 34177200"'),
  '{target_email}', '"service@der-heidehof.de"'
)
WHERE id IN (
  'bar-max-orders', 
  'restaurant-reservations',
  'complaints-contact',
  'conference-service',
  'shop-orders',
  'table-reservations'
);