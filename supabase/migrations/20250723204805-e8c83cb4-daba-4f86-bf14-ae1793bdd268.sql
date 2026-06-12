-- Korrigiere die Formularkonfigurationen mit den richtigen Daten

-- Beauty-Behandlungen: behält seine spezielle Konfiguration
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(
    jsonb_set(fields, '{target_number}', '"+49 176 34177214"'),
    '{target_email}', '"beauty@der-heidehof.de"'
  ),
  '{emailjs_enabled}', 'true'
)
WHERE id = 'beauty-appointments';

-- Alle anderen Formulare: verwenden die allgemeine Service-Konfiguration
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(
    jsonb_set(fields, '{target_number}', '"+49 176 34177200"'),
    '{target_email}', '"service@der-heidehof.de"'
  ),
  '{emailjs_enabled}', 'true'
)
WHERE id IN (
  'bar-max-orders', 
  'restaurant-reservations',
  'complaints-contact',
  'conference-service',
  'shop-orders',
  'table-reservations'
);