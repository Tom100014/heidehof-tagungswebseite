-- Tighten beauty_staff: drop public-readable policy, restrict to authenticated admin/staff/director roles
DROP POLICY IF EXISTS "beauty_staff read" ON public.beauty_staff;

CREATE POLICY "beauty_staff read"
ON public.beauty_staff
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'beauty_staff'::app_role)
  OR public.has_role(auth.uid(), 'director'::app_role)
);

REVOKE SELECT ON public.beauty_staff FROM anon;

-- Tighten google_reviews_settings: drop public read, allow only admins to read
DROP POLICY IF EXISTS "settings public read" ON public.google_reviews_settings;

CREATE POLICY "settings admin read"
ON public.google_reviews_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.google_reviews_settings FROM anon;