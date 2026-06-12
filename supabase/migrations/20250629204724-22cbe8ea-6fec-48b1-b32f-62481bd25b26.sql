
-- Erstelle fehlende RLS Policies für Admin-Zugriff
CREATE POLICY "Admins can view all api_logs" 
ON public.api_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Admins can insert api_logs" 
ON public.api_logs FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Erstelle einen Test-Admin-Benutzer (ersetzen Sie mit echter User-ID wenn verfügbar)
INSERT INTO public.admin_profiles (user_id, email, role, is_active)
VALUES (
  gen_random_uuid(), -- Temporäre UUID - sollte durch echte User-ID ersetzt werden
  'admin@heidehof.com',
  'super_admin',
  true
) ON CONFLICT (user_id) DO NOTHING;

-- Aktiviere RLS für api_logs falls noch nicht aktiviert
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
