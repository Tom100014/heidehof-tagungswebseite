-- Erstelle die fehlende restaurant_bar_orders Tabelle
CREATE TABLE public.restaurant_bar_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_type TEXT NOT NULL CHECK (order_type IN ('restaurant_maxwell', 'bar_max', 'bar_max_snacks')),
  customer_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  room_number TEXT,
  key_number TEXT,
  guest_type TEXT DEFAULT 'hotel_guest',
  delivery_location TEXT,
  specific_location TEXT,
  table_number TEXT,
  bed_number TEXT,
  tent_number TEXT,
  table_or_bed TEXT,
  desired_time TEXT DEFAULT 'now',
  specific_time TEXT,
  contact_method TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  items_text TEXT,
  total_amount NUMERIC(10,2),
  allergies TEXT,
  additional_info TEXT,
  notes TEXT,
  special_requests TEXT,
  send_method TEXT,
  status TEXT NOT NULL DEFAULT 'neu',
  priority BOOLEAN NOT NULL DEFAULT true,
  privacy_accepted BOOLEAN NOT NULL DEFAULT true,
  allow_future_contact BOOLEAN NOT NULL DEFAULT true,
  internal_notes TEXT,
  assigned_staff TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurant_bar_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create restaurant bar orders"
  ON public.restaurant_bar_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all restaurant bar orders" 
  ON public.restaurant_bar_orders FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    ) OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can update restaurant bar orders" 
  ON public.restaurant_bar_orders FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can delete restaurant bar orders" 
  ON public.restaurant_bar_orders FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_restaurant_bar_orders_updated_at
  BEFORE UPDATE ON public.restaurant_bar_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_restaurant_bar_orders_updated_at();