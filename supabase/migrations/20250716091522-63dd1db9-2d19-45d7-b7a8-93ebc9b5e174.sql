-- Update all form configurations with new contact details
UPDATE public.form_configurations 
SET fields = jsonb_set(
  jsonb_set(fields, '{target_number}', '"+49 176 34177214"'),
  '{target_email}', '"sosotech2021@gmail.com"'
)
WHERE id IN (
  'beauty-appointments',
  'bar-max-orders', 
  'restaurant-maxwell-orders',
  'table-reservations',
  'shop-orders',
  'conference-service',
  'complaints-contact'
);