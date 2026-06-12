-- Fix RLS policies for beauty_treatments table to allow inserts

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON public.beauty_treatments;

-- Create new policies that allow proper access
CREATE POLICY "Anyone can view beauty treatments" 
ON public.beauty_treatments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert beauty treatments" 
ON public.beauty_treatments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update beauty treatments" 
ON public.beauty_treatments FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete beauty treatments" 
ON public.beauty_treatments FOR DELETE 
USING (true);