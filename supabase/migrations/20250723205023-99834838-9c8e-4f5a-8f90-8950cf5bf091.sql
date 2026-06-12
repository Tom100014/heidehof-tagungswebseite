-- Korrektur basierend auf den Formularsystem-Daten im Admin
-- Diese Daten sind ausschlaggebend und müssen mit dem Admin-Interface übereinstimmen

-- Allgemeine Service-Konfiguration korrigieren
UPDATE public.general_service_config 
SET 
  default_phone_number = '+49 176 34177214',
  default_email = 'wachendorf23@gmail.com',
  updated_at = now()
WHERE is_active = true;

-- Beauty-Behandlungen Konfiguration korrigieren
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(
    jsonb_set(fields, '{target_number}', '"+49 176 34177214"'),
    '{target_email}', '"wachendorf23@gmail.com"'
  ),
  '{emailjs_enabled}', 'true'
)
WHERE id = 'beauty-appointments';

-- Alle anderen Formulare verwenden die gleichen Daten wie die allgemeine Konfiguration
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(
    jsonb_set(fields, '{target_number}', '"+49 176 34177214"'),
    '{target_email}', '"wachendorf23@gmail.com"'
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