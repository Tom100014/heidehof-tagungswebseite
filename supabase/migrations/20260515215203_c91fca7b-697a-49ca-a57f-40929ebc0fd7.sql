-- Add read_at tracking to all request tables for unread/blink indicator
ALTER TABLE public.tagungs_inquiries ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS category text DEFAULT 'fine_dining';
ALTER TABLE public.room_orders ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.room_orders ADD COLUMN IF NOT EXISTS category text DEFAULT 'room_service';
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.conference_orders ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Indexes for unread queries
CREATE INDEX IF NOT EXISTS idx_tagungs_inquiries_read_at ON public.tagungs_inquiries(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_read_at ON public.restaurant_orders(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_room_orders_read_at ON public.room_orders(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_complaints_read_at ON public.complaints(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conference_orders_read_at ON public.conference_orders(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_category ON public.restaurant_orders(category);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);