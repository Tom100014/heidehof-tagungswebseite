-- Create restaurant_reservations table for phone agent table reservations
CREATE TABLE IF NOT EXISTS public.restaurant_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL,
  contact text,
  persons integer NOT NULL DEFAULT 2,
  reservation_date date,
  reservation_time time,
  notes text,
  confirmed_summary text,
  session_id text,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'phone_agent',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_reservations TO authenticated;
GRANT INSERT ON public.restaurant_reservations TO anon;
GRANT ALL ON public.restaurant_reservations TO service_role;

ALTER TABLE public.restaurant_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone insert reservation"
  ON public.restaurant_reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admins read reservations"
  ON public.restaurant_reservations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update reservations"
  ON public.restaurant_reservations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete reservations"
  ON public.restaurant_reservations FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_restaurant_reservations_read_at ON public.restaurant_reservations(read_at) WHERE read_at IS NULL;

-- Ensure app_settings has an admin_email key (insert default if missing)
INSERT INTO public.app_settings (key, value)
VALUES ('admin_email', '"info@hotel-heidehof.de"'::jsonb)
ON CONFLICT (key) DO NOTHING;