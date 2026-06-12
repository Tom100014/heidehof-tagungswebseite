-- Fix beauty_treatments RLS policies to allow public inserts (like other tables in admin area)

-- Remove the restrictive authenticated-only policy
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON public.beauty_treatments;

-- Add proper policies that allow public access (consistent with other admin tables)
CREATE POLICY "Public can insert beauty treatments" 
ON public.beauty_treatments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update beauty treatments" 
ON public.beauty_treatments FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete beauty treatments" 
ON public.beauty_treatments FOR DELETE 
USING (true);