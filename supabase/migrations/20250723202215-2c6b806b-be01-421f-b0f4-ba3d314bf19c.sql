-- Update alle Formulare mit den Daten aus general_service_config
-- AUSSER beauty-appointments behält seine eigene Konfiguration

-- Alle anderen Formulare bekommen die allgemeinen Service-Daten
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
)
AND id != 'beauty-appointments';

-- Beauty-appointments behält seine spezielle Konfiguration
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(fields, '{target_number}', '"+49 176 34177214"'),
  '{target_email}', '"beauty@der-heidehof.de"'
)
WHERE id = 'beauty-appointments';