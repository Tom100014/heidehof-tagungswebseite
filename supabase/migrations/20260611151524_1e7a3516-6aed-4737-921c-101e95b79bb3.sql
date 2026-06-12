DROP POLICY IF EXISTS elevenlabs_agents_read_all ON public.elevenlabs_agents;
CREATE POLICY elevenlabs_agents_admin_select ON public.elevenlabs_agents FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.elevenlabs_agents FROM anon;