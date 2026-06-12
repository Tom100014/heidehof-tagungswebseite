-- Füge 'restaurant_order' zu beiden CHECK constraints hinzu
ALTER TABLE admin_messages DROP CONSTRAINT IF EXISTS admin_messages_message_type_check;
ALTER TABLE admin_messages DROP CONSTRAINT IF EXISTS message_type_check;

-- Erstelle neuen einheitlichen CHECK constraint mit 'restaurant_order'
ALTER TABLE admin_messages ADD CONSTRAINT admin_messages_message_type_check 
CHECK (message_type = ANY (ARRAY[
  'table_reservation'::text, 
  'restaurant_reservation'::text, 
  'restaurant_order'::text,  -- HINZUGEFÜGT!
  'bar_max_order'::text, 
  'bar_max_reservation'::text, 
  'conference_order'::text, 
  'beauty_appointment'::text, 
  'complaint'::text, 
  'contact_request'::text, 
  'general_inquiry'::text, 
  'Beschwerde/Kontakt'::text, 
  'shop_order'::text, 
  'direct_order'::text,
  'service_request'::text,
  'contact_complaint'::text
]));