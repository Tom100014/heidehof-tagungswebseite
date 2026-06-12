-- Add 'completed' to the allowed status values
ALTER TABLE admin_messages DROP CONSTRAINT admin_messages_status_check;
ALTER TABLE admin_messages ADD CONSTRAINT admin_messages_status_check 
CHECK (status = ANY (ARRAY['sent'::text, 'delivered'::text, 'failed'::text, 'pending'::text, 'completed'::text]));