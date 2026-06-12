
-- 1) Facilities
CREATE TABLE IF NOT EXISTS public.beauty_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#C9A84C',
  capacity int NOT NULL DEFAULT 1,
  sector text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_facilities TO authenticated;
GRANT ALL ON public.beauty_facilities TO service_role;
ALTER TABLE public.beauty_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_facilities read" ON public.beauty_facilities
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'beauty_staff'::app_role)
      OR public.has_role(auth.uid(),'director'::app_role));

CREATE POLICY "beauty_facilities write" ON public.beauty_facilities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'beauty_staff'::app_role)
      OR public.has_role(auth.uid(),'director'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'beauty_staff'::app_role)
      OR public.has_role(auth.uid(),'director'::app_role));

CREATE TRIGGER beauty_facilities_touch BEFORE UPDATE ON public.beauty_facilities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Facility availability
CREATE TABLE IF NOT EXISTS public.beauty_facility_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.beauty_facilities(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  repeat_weekly boolean NOT NULL DEFAULT true,
  repeat_until date,
  valid_from date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS beauty_facility_avail_idx ON public.beauty_facility_availability(facility_id, weekday);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_facility_availability TO authenticated;
GRANT ALL ON public.beauty_facility_availability TO service_role;
ALTER TABLE public.beauty_facility_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_facility_avail read" ON public.beauty_facility_availability
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'beauty_staff'::app_role)
      OR public.has_role(auth.uid(),'director'::app_role));

CREATE POLICY "beauty_facility_avail write" ON public.beauty_facility_availability
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'beauty_staff'::app_role)
      OR public.has_role(auth.uid(),'director'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'beauty_staff'::app_role)
      OR public.has_role(auth.uid(),'director'::app_role));

-- 3) Booking gets optional facility link
ALTER TABLE public.beauty_bookings
  ADD COLUMN IF NOT EXISTS facility_id uuid REFERENCES public.beauty_facilities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS beauty_bookings_facility_idx ON public.beauty_bookings(facility_id, starts_at);
