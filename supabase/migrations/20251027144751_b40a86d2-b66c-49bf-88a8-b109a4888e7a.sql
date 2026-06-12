-- Entferne alten Constraint
ALTER TABLE admin_messages 
DROP CONSTRAINT IF EXISTS admin_messages_message_type_check;

-- Erstelle neuen Constraint mit laundry_order
ALTER TABLE admin_messages 
ADD CONSTRAINT admin_messages_message_type_check 
CHECK (message_type = ANY (ARRAY[
  'room_service_request'::text,
  'restaurant_reservation'::text,
  'beauty_appointment'::text,
  'conference_order'::text,
  'restaurant_order'::text,
  'bar_order'::text,
  'bar_max_order'::text,
  'shop_order'::text,
  'laundry_order'::text,
  'complaint'::text,
  'general_inquiry'::text,
  'admin_reply'::text,
  'custom_reply'::text,
  'direct_order'::text,
  'Beschwerde/Kontakt'::text,
  'complaint_meeting_request'::text
]));