-- Erweitere das Status Check Constraint um 'replied'
ALTER TABLE public.admin_messages 
DROP CONSTRAINT admin_messages_status_check;

ALTER TABLE public.admin_messages 
ADD CONSTRAINT admin_messages_status_check 
CHECK (status = ANY (ARRAY['sent'::text, 'delivered'::text, 'failed'::text, 'pending'::text, 'completed'::text, 'replied'::text]));