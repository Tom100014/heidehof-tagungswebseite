
-- Bereinige alle existierenden RLS-Policies für hotel_settings und erstelle eine einzige, klare Policy
DROP POLICY IF EXISTS "Authenticated users can manage hotel settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Admins can manage hotel settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Public can read hotel settings" ON public.hotel_settings;

-- Erstelle eine neue, vereinfachte Policy die für alle authentifizierten Benutzer funktioniert
CREATE POLICY "Allow authenticated users to manage hotel settings" 
ON public.hotel_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- Stelle sicher, dass RLS aktiviert ist
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;
