-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to manage hotel settings" ON public.hotel_settings;

-- Create more permissive policy for admin operations
CREATE POLICY "Allow admin operations on hotel settings" 
ON public.hotel_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Also ensure RLS is enabled but with broad permissions for this admin table
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;