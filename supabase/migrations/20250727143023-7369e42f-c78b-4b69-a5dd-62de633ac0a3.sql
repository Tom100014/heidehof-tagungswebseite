-- Create draft orders table for real-time saving
CREATE TABLE public.bar_max_draft_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_identifier TEXT, -- could be IP, device ID, etc.
  cart_data JSONB NOT NULL DEFAULT '{}',
  form_data JSONB NOT NULL DEFAULT '{}',
  venue TEXT NOT NULL DEFAULT 'Bar Mäx',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.bar_max_draft_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for draft orders
CREATE POLICY "Anyone can create draft orders"
ON public.bar_max_draft_orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read their own draft orders"
ON public.bar_max_draft_orders
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update their own draft orders"
ON public.bar_max_draft_orders
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete their own draft orders"
ON public.bar_max_draft_orders
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bar_max_draft_orders_updated_at
BEFORE UPDATE ON public.bar_max_draft_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for session lookup
CREATE INDEX idx_bar_max_draft_orders_session_id ON public.bar_max_draft_orders(session_id);

-- Create index for cleanup (expires_at)
CREATE INDEX idx_bar_max_draft_orders_expires_at ON public.bar_max_draft_orders(expires_at);