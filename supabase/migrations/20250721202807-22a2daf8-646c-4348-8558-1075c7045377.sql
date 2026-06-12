-- Fix RLS policy for hotel_settings to allow authenticated users to manage data
DROP POLICY IF EXISTS "Authenticated users can manage hotel settings" ON public.hotel_settings;

CREATE POLICY "Authenticated users can manage hotel settings" 
ON public.hotel_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);