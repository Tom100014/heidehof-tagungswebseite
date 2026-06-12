
ALTER TABLE public.wellness_treatments
  ADD COLUMN IF NOT EXISTS required_skill text,
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS bookable boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.beauty_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beauty_skills TO anon, authenticated;
GRANT ALL ON public.beauty_skills TO service_role;
ALTER TABLE public.beauty_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beauty_skills read" ON public.beauty_skills FOR SELECT USING (true);
CREATE POLICY "beauty_skills write" ON public.beauty_skills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));

CREATE TABLE IF NOT EXISTS public.beauty_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text,
  color text DEFAULT '#C9A84C',
  email text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beauty_staff TO anon, authenticated;
GRANT ALL ON public.beauty_staff TO service_role;
ALTER TABLE public.beauty_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beauty_staff read" ON public.beauty_staff FOR SELECT
  USING (is_active OR public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));
CREATE POLICY "beauty_staff write" ON public.beauty_staff FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));
CREATE TRIGGER beauty_staff_touch BEFORE UPDATE ON public.beauty_staff
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.beauty_staff_skills (
  staff_id uuid NOT NULL REFERENCES public.beauty_staff(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.beauty_skills(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, skill_id)
);
GRANT SELECT ON public.beauty_staff_skills TO anon, authenticated;
GRANT ALL ON public.beauty_staff_skills TO service_role;
ALTER TABLE public.beauty_staff_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beauty_staff_skills read" ON public.beauty_staff_skills FOR SELECT USING (true);
CREATE POLICY "beauty_staff_skills write" ON public.beauty_staff_skills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));

CREATE TABLE IF NOT EXISTS public.beauty_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.beauty_staff(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  valid_from date,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS beauty_shifts_staff_idx ON public.beauty_shifts(staff_id, weekday);
GRANT SELECT ON public.beauty_shifts TO authenticated;
GRANT ALL ON public.beauty_shifts TO service_role;
ALTER TABLE public.beauty_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beauty_shifts read" ON public.beauty_shifts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));
CREATE POLICY "beauty_shifts write" ON public.beauty_shifts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));

CREATE TABLE IF NOT EXISTS public.beauty_shift_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.beauty_staff(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('off','extra')),
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS beauty_overrides_idx ON public.beauty_shift_overrides(staff_id, date);
GRANT SELECT ON public.beauty_shift_overrides TO authenticated;
GRANT ALL ON public.beauty_shift_overrides TO service_role;
ALTER TABLE public.beauty_shift_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beauty_overrides read" ON public.beauty_shift_overrides FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));
CREATE POLICY "beauty_overrides write" ON public.beauty_shift_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS public.beauty_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id uuid REFERENCES public.wellness_treatments(id) ON DELETE SET NULL,
  treatment_title text NOT NULL,
  treatment_duration_min integer NOT NULL,
  staff_id uuid REFERENCES public.beauty_staff(id) ON DELETE SET NULL,
  staff_name text,
  guest_name text NOT NULL,
  guest_phone text,
  guest_email text,
  guest_room text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','in_service','done','cancelled','no_show')),
  source text NOT NULL DEFAULT 'frontend' CHECK (source IN ('frontend','admin','clara','phone')),
  notes text,
  price_eur numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS beauty_bookings_staff_time_idx ON public.beauty_bookings(staff_id, starts_at);
CREATE INDEX IF NOT EXISTS beauty_bookings_date_idx ON public.beauty_bookings(starts_at);
CREATE INDEX IF NOT EXISTS beauty_bookings_status_idx ON public.beauty_bookings(status);

ALTER TABLE public.beauty_bookings
  ADD CONSTRAINT beauty_bookings_no_overlap
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (staff_id IS NOT NULL AND status NOT IN ('cancelled','no_show'));

GRANT SELECT, INSERT, UPDATE ON public.beauty_bookings TO authenticated;
GRANT ALL ON public.beauty_bookings TO service_role;
ALTER TABLE public.beauty_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beauty_bookings read" ON public.beauty_bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));
CREATE POLICY "beauty_bookings write" ON public.beauty_bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'beauty_staff'::app_role) OR public.has_role(auth.uid(),'director'::app_role));

CREATE TRIGGER beauty_bookings_touch BEFORE UPDATE ON public.beauty_bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.beauty_bookings;

INSERT INTO public.beauty_skills (slug, label, sort_order) VALUES
  ('massage', 'Massage', 10),
  ('kosmetik', 'Kosmetik / Gesichtsbehandlung', 20),
  ('manikuere', 'Maniküre & Pediküre', 30),
  ('hot_stone', 'Hot Stone', 40),
  ('ayurveda', 'Ayurveda', 50),
  ('hammam', 'Hammam', 60)
ON CONFLICT (slug) DO NOTHING;
