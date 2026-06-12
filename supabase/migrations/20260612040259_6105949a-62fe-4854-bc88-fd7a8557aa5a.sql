
-- 1) Remove elevenlabs_agent_id from public app_settings read policy (use edge function instead)
DROP POLICY IF EXISTS "Public can read clara public settings" ON public.app_settings;
CREATE POLICY "Public can read clara public settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (key = ANY (ARRAY['elevenlabs_mode'::text, 'clara_voice_id'::text, 'clara_tts_model'::text]));

-- 2) Restrict beauty_skills SELECT to staff/admin/director
DROP POLICY IF EXISTS "beauty_skills read" ON public.beauty_skills;
CREATE POLICY "beauty_skills read"
ON public.beauty_skills
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'beauty_staff'::app_role)
  OR has_role(auth.uid(), 'director'::app_role)
);

-- 3) Restrict beauty_staff_skills SELECT to staff/admin/director
DROP POLICY IF EXISTS "beauty_staff_skills read" ON public.beauty_staff_skills;
CREATE POLICY "beauty_staff_skills read"
ON public.beauty_staff_skills
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'beauty_staff'::app_role)
  OR has_role(auth.uid(), 'director'::app_role)
);

-- Revoke anon SELECT on the beauty tables
REVOKE SELECT ON public.beauty_skills FROM anon;
REVOKE SELECT ON public.beauty_staff_skills FROM anon;
