
-- Create a notifications table to track all message types in a consistent way
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email', 'copy')),
  recipient TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'opened', 'failed', 'copied')),
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comments for better documentation
COMMENT ON TABLE public.notifications IS 'Tracks all outgoing notifications across different channels';
COMMENT ON COLUMN public.notifications.channel IS 'Communication channel: sms, whatsapp, email, or copy';
COMMENT ON COLUMN public.notifications.recipient IS 'Phone number or email address of the recipient';
COMMENT ON COLUMN public.notifications.content IS 'Actual content of the message that was sent';
COMMENT ON COLUMN public.notifications.status IS 'Current status of the message: sent, opened, failed, or copied';
COMMENT ON COLUMN public.notifications.payload IS 'Additional metadata related to the message';

-- Index to optimize queries by channel or status
CREATE INDEX IF NOT EXISTS notifications_channel_idx ON public.notifications (channel);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON public.notifications (status);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at);
