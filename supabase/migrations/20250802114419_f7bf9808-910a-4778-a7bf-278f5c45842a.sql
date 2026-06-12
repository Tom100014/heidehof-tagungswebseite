-- Add replied_at column to admin_messages table
ALTER TABLE public.admin_messages 
ADD COLUMN replied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add reply_content column to store the reply message
ALTER TABLE public.admin_messages 
ADD COLUMN reply_content TEXT DEFAULT NULL;