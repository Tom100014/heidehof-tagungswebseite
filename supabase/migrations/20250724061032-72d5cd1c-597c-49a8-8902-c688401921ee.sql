-- Fix admin_messages table message_type constraints
-- Add all required message types for the admin logging system

-- First, drop the existing constraint if it exists
ALTER TABLE public.admin_messages DROP CONSTRAINT IF EXISTS message_type_check;

-- Add the new constraint with all required message types
ALTER TABLE public.admin_messages 
ADD CONSTRAINT message_type_check 
CHECK (message_type IN (
  'restaurant_reservation',
  'table_reservation', 
  'bar_max_order',
  'conference_order',
  'beauty_appointment',
  'contact_complaint',
  'Beschwerde/Kontakt',
  'shop_order',
  'service_request',
  'general_inquiry'
));