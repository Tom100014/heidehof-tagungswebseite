-- Create customer_profiles table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stammdaten
  full_name TEXT NOT NULL,
  room_number TEXT,
  spa_key_number TEXT,
  phone_number TEXT,
  email TEXT,
  guest_type TEXT CHECK (guest_type IN ('hotel', 'spa', 'conference')),
  
  -- Aufenthalt
  check_in_date DATE,
  check_out_date DATE,
  
  -- KI-Daten
  intelligence_score INTEGER DEFAULT 0,
  customer_category TEXT CHECK (customer_category IN ('vip', 'power_user', 'new', 'risk', 'regular')) DEFAULT 'new',
  preferences JSONB DEFAULT '{}',
  ai_insights JSONB DEFAULT '{}',
  
  -- Statistiken
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  avg_order_value NUMERIC DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  favorite_services TEXT[] DEFAULT '{}',
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (nur Admins haben Zugriff)
CREATE POLICY "Allow admin access to customer_profiles"
ON public.customer_profiles
FOR ALL
USING (true);

-- Create customer_unified_orders view
CREATE OR REPLACE VIEW public.customer_unified_orders AS
SELECT 
  id,
  customer_name,
  room_number,
  'room_service' as order_source,
  kategorie as category,
  total_amount,
  items::TEXT,
  status,
  created_at,
  contact_method,
  contact_value as contact_info,
  notes
FROM public.restaurant_orders
UNION ALL
SELECT 
  id,
  customer_name,
  room_number,
  'bar_max' as order_source,
  'bar' as category,
  total_amount,
  items_text as items,
  status,
  created_at,
  contact_method,
  contact_value as contact_info,
  special_requests as notes
FROM public.bar_max_orders
UNION ALL
SELECT 
  id,
  customer_name,
  room_number,
  'shop' as order_source,
  kategorie as category,
  total_amount,
  items::jsonb::TEXT,
  status,
  created_at,
  'info' as contact_method,
  contact_info,
  notes
FROM public.shop_orders
UNION ALL
SELECT 
  id,
  full_name as customer_name,
  room_number,
  'beauty' as order_source,
  treatment_type as category,
  0 as total_amount,
  treatment_type as items,
  status,
  timestamp as created_at,
  'phone' as contact_method,
  COALESCE(phone_number, '') as contact_info,
  additional_requests as notes
FROM public.beauty_appointments;

-- Add unique constraint for customer name lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_name ON public.customer_profiles(full_name);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_category ON public.customer_profiles(customer_category);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_score ON public.customer_profiles(intelligence_score DESC);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_active ON public.customer_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_room ON public.customer_profiles(room_number);