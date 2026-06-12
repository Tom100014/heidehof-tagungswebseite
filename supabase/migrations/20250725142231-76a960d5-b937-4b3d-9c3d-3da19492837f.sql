-- Neue einheitliche Tabelle für Restaurant, Bar Mäx und Bar Mäx Snacks Bestellungen
CREATE TABLE public.restaurant_bar_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basis-Informationen
  order_type TEXT NOT NULL CHECK (order_type IN ('restaurant_maxwell', 'bar_max', 'bar_max_snacks')),
  customer_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  
  -- Kontakt und Ort
  room_number TEXT,
  key_number TEXT,
  guest_type TEXT DEFAULT 'hotel_guest',
  
  -- Lieferung
  delivery_location TEXT,
  specific_location TEXT,
  table_number TEXT,
  bed_number TEXT,
  tent_number TEXT,
  table_or_bed TEXT,
  
  -- Zeit
  desired_time TEXT DEFAULT 'now',
  specific_time TEXT,
  
  -- Kontakt
  contact_method TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  
  -- Bestellung
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  items_text TEXT, -- Für kompatibilität mit altem System
  total_amount NUMERIC(10,2),
  
  -- Zusätzliche Informationen
  allergies TEXT,
  additional_info TEXT,
  notes TEXT,
  special_requests TEXT,
  
  -- Versand und Status
  send_method TEXT,
  status TEXT NOT NULL DEFAULT 'neu',
  priority BOOLEAN DEFAULT true,
  
  -- Datenschutz
  privacy_accepted BOOLEAN NOT NULL DEFAULT true,
  allow_future_contact BOOLEAN DEFAULT true,
  
  -- Admin
  internal_notes TEXT,
  assigned_staff TEXT,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index für bessere Performance
CREATE INDEX idx_restaurant_bar_orders_type ON public.restaurant_bar_orders(order_type);
CREATE INDEX idx_restaurant_bar_orders_status ON public.restaurant_bar_orders(status);
CREATE INDEX idx_restaurant_bar_orders_created_at ON public.restaurant_bar_orders(created_at DESC);
CREATE INDEX idx_restaurant_bar_orders_customer ON public.restaurant_bar_orders(customer_name);

-- RLS aktivieren
ALTER TABLE public.restaurant_bar_orders ENABLE ROW LEVEL SECURITY;

-- Policies erstellen
CREATE POLICY "Jeder kann Bestellungen erstellen"
ON public.restaurant_bar_orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins können alle Bestellungen verwalten"
ON public.restaurant_bar_orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION public.update_restaurant_bar_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurant_bar_orders_updated_at
  BEFORE UPDATE ON public.restaurant_bar_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_restaurant_bar_orders_updated_at();