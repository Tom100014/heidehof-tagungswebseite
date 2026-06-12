-- Korrektur der general_service_config mit den richtigen allgemeinen Service-Daten
UPDATE public.general_service_config 
SET 
  default_phone_number = '+49 176 34177200',
  default_email = 'service@der-heidehof.de',
  updated_at = now()
WHERE is_active = true;

-- Stelle sicher, dass die Beauty-Konfiguration korrekt ist
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(fields, '{target_number}', '"+49 176 34177214"'),
  '{target_email}', '"beauty@der-heidehof.de"'
)
WHERE id = 'beauty-appointments';

-- Alle anderen Formulare verwenden die allgemeine Service-Konfiguration
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