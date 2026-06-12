-- Konfiguriere Admin-Nummer für Restaurant Reservierungen
UPDATE form_configurations 
SET fields = jsonb_set(
  jsonb_set(
    COALESCE(fields, '{}'::jsonb),
    '{target_number}', 
    '"+49 176 34177214"'::jsonb
  ),
  '{sms_enabled}',
  'true'::jsonb
)
WHERE id = 'restaurant-reservations';