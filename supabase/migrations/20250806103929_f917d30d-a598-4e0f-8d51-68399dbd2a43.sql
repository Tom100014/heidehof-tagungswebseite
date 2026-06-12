-- Update admin_messages table to include all existing form types
ALTER TABLE admin_messages DROP CONSTRAINT IF EXISTS admin_messages_message_type_check;

-- Add comprehensive message type constraint that includes all existing and new form types
ALTER TABLE admin_messages ADD CONSTRAINT admin_messages_message_type_check 
CHECK (message_type IN (
  'Beschwerde/Kontakt',
  'beauty_appointment', 
  'restaurant_order',
  'bar_max_order',
  'conference_order',
  'table_reservation',
  'restaurant_reservation',
  'shop_order',
  'direct_order',
  'custom_reply',
  'admin_reply'
));

-- Ensure recipient_type supports all contact methods
ALTER TABLE admin_messages DROP CONSTRAINT IF EXISTS admin_messages_recipient_type_check;
ALTER TABLE admin_messages ADD CONSTRAINT admin_messages_recipient_type_check 
CHECK (recipient_type IN ('whatsapp', 'sms', 'email'));