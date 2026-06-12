-- Drop old restaurant reservation tables if they exist
DROP TABLE IF EXISTS public.restaurant_reservations CASCADE;
DROP TABLE IF EXISTS public.restaurant_reservation_images CASCADE;

-- Create unified table_reservations table with same structure as beauty appointments
CREATE TABLE public.table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  room_number TEXT,
  guest_type TEXT NOT NULL DEFAULT 'hotel_guest' CHECK (guest_type IN ('hotel_guest', 'external_guest')),
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  person_count INTEGER NOT NULL DEFAULT 2,
  contact_method TEXT NOT NULL CHECK (contact_method IN ('whatsapp', 'sms')),
  contact_value TEXT NOT NULL,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  internal_notes TEXT,
  priority BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create table reservations"
  ON public.table_reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all table reservations"
  ON public.table_reservations FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_table_reservations_updated_at
  BEFORE UPDATE ON public.table_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();