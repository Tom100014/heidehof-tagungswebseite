-- Create admin_messages table for centralized message management
CREATE TABLE public.admin_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_type TEXT NOT NULL CHECK (message_type IN (
    'table_reservation', 'bar_max_order', 'bar_max_reservation', 
    'conference_order', 'beauty_appointment', 'complaint', 
    'contact_request', 'general_inquiry'
  )),
  source_form TEXT NOT NULL, -- Which form/system sent this
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('whatsapp', 'sms', 'email')),
  recipient_contact TEXT NOT NULL, -- Phone number or email
  message_content TEXT NOT NULL, -- The actual message sent
  customer_name TEXT,
  room_number TEXT,
  order_reference TEXT, -- Reference to original order/reservation
  metadata JSONB DEFAULT '{}', -- Additional form-specific data
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  admin_notes TEXT,
  priority BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all messages"
  ON public.admin_messages 
  FOR SELECT 
  USING (is_admin());

CREATE POLICY "Admins can update messages"
  ON public.admin_messages 
  FOR UPDATE 
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role can insert messages"
  ON public.admin_messages 
  FOR INSERT 
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_admin_messages_message_type ON public.admin_messages(message_type);
CREATE INDEX idx_admin_messages_sent_at ON public.admin_messages(sent_at DESC);
CREATE INDEX idx_admin_messages_status ON public.admin_messages(status);
CREATE INDEX idx_admin_messages_customer_name ON public.admin_messages(customer_name);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_messages_updated_at
  BEFORE UPDATE ON public.admin_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();