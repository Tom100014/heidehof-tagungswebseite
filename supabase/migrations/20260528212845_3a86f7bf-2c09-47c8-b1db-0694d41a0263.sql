ALTER TABLE public.tagungs_inquiries ADD COLUMN IF NOT EXISTS source text DEFAULT 'web';
ALTER TABLE public.conference_orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'web';
ALTER TABLE public.tagungs_inquiries ADD COLUMN IF NOT EXISTS prepared_reply text;
ALTER TABLE public.conference_orders ADD COLUMN IF NOT EXISTS prepared_reply text;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS prepared_reply text;
ALTER TABLE public.room_orders ADD COLUMN IF NOT EXISTS prepared_reply text;